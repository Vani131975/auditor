import os
import json
import torch
import zipfile
from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForQuestionAnswering,
    TrainingArguments,
    Trainer,
    DefaultDataCollator
)

MODEL_NAME = "nlpaueb/legal-bert-base-uncased"
OUTPUT_DIR = "./finetuned_legal_bert"

def find_cuad_json():
    """Searches for CUAD_v1.json in common places (including Google Drive)"""
    search_paths = [
        "CUAD_v1.json",
        "CUAD_v1/CUAD_v1.json",
        "/content/drive/MyDrive/CUAD_v1.json", # If uploaded to drive root
        "/content/drive/MyDrive/CUAD_v1/CUAD_v1.json"
    ]
    
    for p in search_paths:
        if os.path.exists(p):
            return p
            
    # If not found, check for ZIP files in those same places
    zip_paths = [
        "CUAD_v1.zip",
        "/content/drive/MyDrive/CUAD_v1.zip"
    ]
    
    for p in zip_paths:
        if os.path.exists(p):
            print(f"Found {p}! Extracting...")
            try:
                with zipfile.ZipFile(p, 'r') as zip_ref:
                    zip_ref.extractall("/content/")
                if os.path.exists("/content/CUAD_v1/CUAD_v1.json"):
                    return "/content/CUAD_v1/CUAD_v1.json"
            except Exception as e:
                print(f"WARNING: The zip file at {p} is corrupted: {e}")
                
    return None

def load_cuad_as_dataset(file_path):
    print(f"Parsing {file_path}...")
    with open(file_path, "r", encoding="utf-8") as f:
        cuad_data = json.load(f)
    
    contexts, questions, answers = [], [], []
    for article in cuad_data["data"]:
        for paragraph in article["paragraphs"]:
            context = paragraph["context"]
            for qa in paragraph["qas"]:
                question = qa["question"]
                if not qa.get("is_impossible", False) and len(qa["answers"]) > 0:
                    ans = qa["answers"][0]
                    answers.append({"answer_start": [ans["answer_start"]], "text": [ans["text"]]})
                else:
                    answers.append({"answer_start": [], "text": []})
                contexts.append(context)
                questions.append(question)
                
    return Dataset.from_dict({"context": contexts, "question": questions, "answers": answers})

def main():
    json_path = find_cuad_json()
    
    if not json_path:
        print("\n" + "="*80)
        print("CRITICAL ERROR: Could not find an uncorrupted CUAD_v1 dataset.")
        print("Because Colab's file browser breaks large uploads, please do the following:")
        print("1. Upload 'CUAD_v1.zip' to your Google Drive.")
        print("2. Run this command in a new Colab cell to connect your Drive:")
        print("   from google.colab import drive")
        print("   drive.mount('/content/drive')")
        print("3. Run this script again.")
        print("="*80 + "\n")
        return

    print("Loading model and tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForQuestionAnswering.from_pretrained(MODEL_NAME)

    dataset = load_cuad_as_dataset(json_path)
    print(f"Loaded {len(dataset)} Question-Answering pairs.")

    pad_on_right = tokenizer.padding_side == "right"
    max_length = 384
    doc_stride = 128

    def prepare_train_features(examples):
        examples["question"] = [q.lstrip() for q in examples["question"]]

        tokenized_examples = tokenizer(
            examples["question" if pad_on_right else "context"],
            examples["context" if pad_on_right else "question"],
            truncation="only_second" if pad_on_right else "only_first",
            max_length=max_length,
            stride=doc_stride,
            return_overflowing_tokens=True,
            return_offsets_mapping=True,
            padding="max_length",
        )

        sample_mapping = tokenized_examples.pop("overflow_to_sample_mapping")
        offset_mapping = tokenized_examples.pop("offset_mapping")

        tokenized_examples["start_positions"] = []
        tokenized_examples["end_positions"] = []

        for i, offsets in enumerate(offset_mapping):
            input_ids = tokenized_examples["input_ids"][i]
            cls_index = input_ids.index(tokenizer.cls_token_id)
            sequence_ids = tokenized_examples.sequence_ids(i)

            sample_index = sample_mapping[i]
            answers = examples["answers"][sample_index]

            if len(answers["answer_start"]) == 0:
                tokenized_examples["start_positions"].append(cls_index)
                tokenized_examples["end_positions"].append(cls_index)
            else:
                start_char = answers["answer_start"][0]
                end_char = start_char + len(answers["text"][0])

                token_start_index = 0
                while sequence_ids[token_start_index] != (1 if pad_on_right else 0):
                    token_start_index += 1

                token_end_index = len(input_ids) - 1
                while sequence_ids[token_end_index] != (1 if pad_on_right else 0):
                    token_end_index -= 1

                if not (offsets[token_start_index][0] <= start_char and offsets[token_end_index][1] >= end_char):
                    tokenized_examples["start_positions"].append(cls_index)
                    tokenized_examples["end_positions"].append(cls_index)
                else:
                    while token_start_index < len(offsets) and offsets[token_start_index][0] <= start_char:
                        token_start_index += 1
                    tokenized_examples["start_positions"].append(token_start_index - 1)
                    while offsets[token_end_index][1] >= end_char:
                        token_end_index -= 1
                    tokenized_examples["end_positions"].append(token_end_index + 1)

        return tokenized_examples

    print("Tokenizing Dataset (Using RAM-safe batches, please wait)...")
    tokenized_dataset = dataset.map(
        prepare_train_features, 
        batched=True, 
        batch_size=32, # Drastically reduced from default 1000 to prevent Colab Out-Of-Memory crashes
        remove_columns=dataset.column_names
    )

    split_dataset = tokenized_dataset.train_test_split(test_size=0.1)

    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        eval_strategy="no",
        learning_rate=3e-5,
        per_device_train_batch_size=8,
        num_train_epochs=3,
        weight_decay=0.01,
        fp16=torch.cuda.is_available(),
        save_strategy="epoch",
    )

    data_collator = DefaultDataCollator()

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=split_dataset["train"],
        data_collator=data_collator,
        processing_class=tokenizer,
    )

    print("Starting training process...")
    trainer.train()

    print("Saving final model to", OUTPUT_DIR)
    trainer.save_model(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    print("Done! You can now zip the 'finetuned_legal_bert' folder and download it.")

if __name__ == "__main__":
    main()
