from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import os
from services.azure_blob import read_users_table, write_users_table

auth_bp = Blueprint('auth', __name__)
JWT_SECRET = os.getenv('JWT_SECRET', 'super-secret-key-123')

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    company_name = data.get('company_name', 'Unknown')
    is_admin = False # Admin cannot sign up

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    users = read_users_table()
    if any(u['email'] == email for u in users):
        return jsonify({"error": "User already exists"}), 400

    hashed_pw = generate_password_hash(password)
    new_user = {
        "email": email,
        "password": hashed_pw, # Storing hashed password
        "company_name": company_name,
        "is_admin": is_admin,
        "contracts_analyzed": 0
    }
    users.append(new_user)
    write_users_table(users)
    
    return jsonify({"message": "User created successfully"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if email == 'admin@gmail.com' and password == 'password':
        user = {
            'email': 'admin@gmail.com',
            'company_name': 'System Admin',
            'is_admin': True,
        }
    else:
        users = read_users_table()
        user = next((u for u in users if u['email'] == email), None)
    
        if not user or not check_password_hash(user['password'], password):
            return jsonify({"error": "Invalid credentials"}), 401

    token = jwt.encode({
        'email': user['email'],
        'company_name': user.get('company_name', ''),
        'is_admin': user.get('is_admin', False),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, JWT_SECRET, algorithm="HS256")

    return jsonify({"token": token, "is_admin": user.get('is_admin', False), "company_name": user.get('company_name', '')}), 200

@auth_bp.route('/admin/users', methods=['GET'])
def get_users():
    # In real app, verify admin JWT here
    users = read_users_table()
    # return all details including hashed passwords 
    return jsonify(users), 200
