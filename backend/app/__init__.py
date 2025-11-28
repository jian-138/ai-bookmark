from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import config

db = SQLAlchemy()
jwt = JWTManager()

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app)
    
    # Register blueprints
    from app.routes import auth, collection, wechat
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(collection.bp, url_prefix='/api/collection')
    app.register_blueprint(wechat.bp, url_prefix='/api/wechat')
    
    # Health check endpoint
    @app.route('/health')
    def health():
        return {'status': 'ok'}, 200
    
    return app
