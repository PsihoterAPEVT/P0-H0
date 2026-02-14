import os
import uuid
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, session, jsonify, send_from_directory, flash
from werkzeug.utils import secure_filename
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
import requests
from dotenv import load_dotenv

from database import db, Video, Donation
from models import AdminUser

# Загрузка переменных окружения
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'swill-super-secret-key-2026')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///swill.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB

# Создание папок
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs('static', exist_ok=True)
os.makedirs('templates', exist_ok=True)

# Инициализация
db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Конфигурация ЮMoney
YMONEY_SHOP_ID = os.getenv('YMONEY_SHOP_ID', 'ваш_shop_id')
YMONEY_SECRET_KEY = os.getenv('YMONEY_SECRET_KEY', 'ваш_secret_key')
YMONEY_RETURN_URL = os.getenv('YMONEY_RETURN_URL', 'https://swill-pay.onrender.com/donate/success')

# ============= ЗАГРУЗЧИК ПОЛЬЗОВАТЕЛЯ =============
@login_manager.user_loader
def load_user(user_id):
    return AdminUser.query.get(int(user_id))

# ============= СОЗДАНИЕ БАЗЫ ПРИ ЗАПУСКЕ =============
with app.app_context():
    db.create_all()
    # Создание админа если нет
    if not AdminUser.query.first():
        admin = AdminUser(username='admin')
        admin.set_password('swillmaster2025')
        db.session.add(admin)
        db.session.commit()
        print("✅ Админ создан: admin / swillmaster2025")

# ============= ГЛАВНАЯ СТРАНИЦА =============
@app.route('/')
def index():
    videos = Video.query.filter_by(is_active=True).order_by(Video.created_at.desc()).all()
    return render_template('index.html', videos=videos)

# ============= СТРАНИЦА ВИДЕО =============
@app.route('/video/<int:video_id>')
def video_page(video_id):
    video = Video.query.get_or_404(video_id)
    video.views += 1
    db.session.commit()
    return render_template('video.html', video=video)

# ============= СТРАНИЦА ДОНАТА =============
@app.route('/donate')
def donate_page():
    return render_template('donate.html')

# ============= СОЗДАНИЕ ПЛАТЕЖА ЮМАНИ =============
@app.route('/create_payment', methods=['POST'])
def create_payment():
    amount = request.form.get('amount', 100)
    email = request.form.get('email', '')
    
    # Создание платежа (здесь нужно подключение к API ЮMoney)
    # В реальности - запрос к API ЮMoney
    
    # Тестовая заглушка:
    payment_id = str(uuid.uuid4())
    donation = Donation(
        amount=float(amount),
        email=email,
        payment_id=payment_id,
        status='pending'
    )
    db.session.add(donation)
    db.session.commit()
    
    # Редирект на ЮMoney (тестовая ссылка)
    return redirect(f"https://yoomoney.ru/quickpay/confirm.xml?receiver={YMONEY_SHOP_ID}&sum={amount}&quickpay-form=donate&paymentType=AC")

# ============= УСПЕШНЫЙ ПЛАТЕЖ =============
@app.route('/donate/success')
def donate_success():
    # Обработка успешного платежа
    # В реальности - проверка подписи от ЮMoney
    flash('Спасибо за поддержку! Видео разблокировано на 24 часа.', 'success')
    return redirect(url_for('index'))

# ============= ВХОД В АДМИНКУ =============
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = AdminUser.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('admin_panel'))
        flash('Неверный логин или пароль', 'error')
    return render_template('login.html')

# ============= ВЫХОД ИЗ АДМИНКИ =============
@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

# ============= АДМИН ПАНЕЛЬ =============
@app.route('/admin')
@login_required
def admin_panel():
    videos = Video.query.order_by(Video.created_at.desc()).all()
    donations = Donation.query.order_by(Donation.created_at.desc()).limit(20).all()
    total_earned = db.session.query(db.func.sum(Donation.amount)).filter_by(status='success').scalar() or 0
    return render_template('admin.html', videos=videos, donations=donations, total_earned=total_earned)

# ============= ЗАГРУЗКА ВИДЕО =============
@app.route('/upload', methods=['POST'])
@login_required
def upload_video():
    title = request.form.get('title')
    description = request.form.get('description')
    
    if 'video' not in request.files or 'thumbnail' not in request.files:
        flash('Нужны видео и превью', 'error')
        return redirect(url_for('admin_panel'))
    
    video = request.files['video']
    thumbnail = request.files['thumbnail']
    
    if video.filename == '' or thumbnail.filename == '':
        flash('Выберите файлы', 'error')
        return redirect(url_for('admin_panel'))
    
    # Сохранение файлов
    video_filename = secure_filename(f"video_{datetime.now().timestamp()}_{video.filename}")
    thumb_filename = secure_filename(f"thumb_{datetime.now().timestamp()}_{thumbnail.filename}")
    
    video.save(os.path.join(app.config['UPLOAD_FOLDER'], video_filename))
    thumbnail.save(os.path.join(app.config['UPLOAD_FOLDER'], thumb_filename))
    
    # Сохранение в БД
    new_video = Video(
        title=title,
        description=description,
        filename=video_filename,
        thumbnail=thumb_filename
    )
    db.session.add(new_video)
    db.session.commit()
    
    flash('Видео успешно загружено!', 'success')
    return redirect(url_for('admin_panel'))

# ============= УДАЛЕНИЕ ВИДЕО =============
@app.route('/delete_video/<int:video_id>')
@login_required
def delete_video(video_id):
    video = Video.query.get_or_404(video_id)
    # Удаление файлов
    try:
        os.remove(os.path.join(app.config['UPLOAD_FOLDER'], video.filename))
        os.remove(os.path.join(app.config['UPLOAD_FOLDER'], video.thumbnail))
    except:
        pass
    # Удаление из БД
    db.session.delete(video)
    db.session.commit()
    flash('Видео удалено', 'success')
    return redirect(url_for('admin_panel'))

# ============= СТАТИЧЕСКИЕ ФАЙЛЫ =============
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ============= API ДЛЯ СТАТИСТИКИ =============
@app.route('/api/stats')
def api_stats():
    total_videos = Video.query.count()
    total_views = db.session.query(db.func.sum(Video.views)).scalar() or 0
    total_donations = db.session.query(db.func.sum(Donation.amount)).filter_by(status='success').scalar() or 0
    return jsonify({
        'videos': total_videos,
        'views': total_views,
        'earned': float(total_donations)
    })

# ============= ЗАПУСК =============
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)