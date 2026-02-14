/**
 * SWILL PREMIUM - ФИОЛЕТОВЫЙ САЙТ С ДОНАТАМИ
 * Анимации, платежи, автоподсчет
 */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    
    console.log('⚡ SWILL PREMIUM ACTIVATED');
    
    // ============= АНИМАЦИЯ ЗАГРУЗКИ =============
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.8s ease';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
    
    // ============= ФИОЛЕТОВЫЙ КУРСОР И СКРОЛЛ =============
    const style = document.createElement('style');
    style.textContent = `
        *::selection {
            background: #6b21a8;
            color: white;
        }
        
        ::-webkit-scrollbar {
            width: 12px;
        }
        
        ::-webkit-scrollbar-track {
            background: #0a0a0f;
        }
        
        ::-webkit-scrollbar-thumb {
            background: #6b21a8;
            border-radius: 6px;
            border: 2px solid #0a0a0f;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: #a855f7;
        }
    `;
    document.head.appendChild(style);
    
    // ============= ВЫБОР СУММЫ ДЛЯ ДОНАТА =============
    const amountButtons = document.querySelectorAll('.amount-btn');
    const amountInput = document.getElementById('amount');
    
    if (amountButtons.length && amountInput) {
        amountButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                // Убираем выделение со всех
                amountButtons.forEach(b => {
                    b.style.background = '#1e1e2a';
                    b.style.color = '#c084fc';
                });
                
                // Выделяем текущую
                this.style.background = '#6b21a8';
                this.style.color = 'white';
                
                // Устанавливаем сумму
                const amount = this.textContent.replace(/[^0-9]/g, '');
                amountInput.value = amount;
            });
        });
    }
    
    // ============= ПРЕДПРОСМОТР ФАЙЛОВ =============
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    fileInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                const fileName = file.name;
                const fileSize = (file.size / 1024 / 1024).toFixed(2);
                
                // Создаем индикатор
                const indicator = document.createElement('div');
                indicator.className = 'file-indicator';
                indicator.style.cssText = `
                    margin-top: 10px;
                    padding: 10px 15px;
                    background: #1e1e2a;
                    border-radius: 10px;
                    color: #d8b4fe;
                    font-size: 14px;
                    border-left: 4px solid #6b21a8;
                    font-family: monospace;
                `;
                
                // Иконка в зависимости от типа
                let icon = '📁';
                if (file.type.includes('video')) icon = '🎬';
                if (file.type.includes('image')) icon = '🖼️';
                
                indicator.innerHTML = `${icon} ${fileName} (${fileSize} MB)`;
                
                // Удаляем старый индикатор
                const oldIndicator = this.parentNode.querySelector('.file-indicator');
                if (oldIndicator) oldIndicator.remove();
                
                this.parentNode.appendChild(indicator);
            }
        });
    });
    
    // ============= АВТООБНОВЛЕНИЕ СТАТИСТИКИ =============
    function updateStats() {
        fetch('/api/stats')
            .then(response => response.json())
            .then(data => {
                // Обновляем цифры на странице
                const statElements = document.querySelectorAll('.stat-value');
                if (statElements.length >= 3) {
                    // Предполагаем порядок: видео, просмотры, заработано
                    if (statElements[0]) statElements[0].textContent = data.videos;
                    if (statElements[1]) statElements[1].textContent = data.views.toLocaleString();
                    if (statElements[2]) statElements[2].textContent = data.earned.toLocaleString() + ' ₽';
                }
                
                // Подсветка при обновлении
                const stats = document.querySelector('.stats');
                if (stats) {
                    stats.style.animation = 'none';
                    stats.offsetHeight;
                    stats.style.animation = 'pulse 0.5s ease';
                }
            })
            .catch(err => console.log('Stats update error:', err));
    }
    
    // Обновляем каждые 10 секунд
    setInterval(updateStats, 10000);
    
    // ============= КНОПКА КОПИРОВАНИЯ =============
    window.copyToClipboard = function(text, message = '✅ СКОПИРОВАНО!') {
        navigator.clipboard.writeText(text).then(() => {
            // Создаем уведомление
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #6b21a8;
                color: white;
                padding: 15px 30px;
                border-radius: 40px;
                font-weight: 600;
                z-index: 9999;
                animation: slideIn 0.3s ease;
                box-shadow: 0 0 30px #6b21a8;
                border: 1px solid #a855f7;
            `;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        });
    };
    
    // ============= ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ =============
    window.confirmDelete = function(message = 'Удалить видео?') {
        return confirm(message);
    };
    
    // ============= ПЛАВНАЯ ПРОКРУТКА =============
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // ============= ЗАЩИТА КОНТЕНТА (только для видео) =============
    document.addEventListener('contextmenu', function(e) {
        if (e.target.tagName === 'VIDEO') {
            e.preventDefault();
            return false;
        }
    });
    
    // ============= ДИНАМИЧЕСКИЙ БЭКГРАУНД (ПАРТИКЛЫ) =============
    if (window.innerWidth > 768) {
        // Только на десктопах
        const canvas = document.createElement('canvas');
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            opacity: 0.15;
        `;
        document.body.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];
        
        function initParticles() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            
            particles = [];
            for (let i = 0; i < 50; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    size: Math.random() * 3 + 1,
                    speedY: Math.random() * 0.5 + 0.2,
                    opacity: Math.random() * 0.5 + 0.2
                });
            }
        }
        
        function drawParticles() {
            ctx.clearRect(0, 0, width, height);
            
            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(168, 85, 247, ${p.opacity})`;
                ctx.fill();
                
                // Движение вверх
                p.y -= p.speedY;
                if (p.y < -10) {
                    p.y = height + 10;
                    p.x = Math.random() * width;
                }
            });
            
            requestAnimationFrame(drawParticles);
        }
        
        initParticles();
        drawParticles();
        
        window.addEventListener('resize', initParticles);
    }
    
    // ============= АНИМАЦИИ ДЛЯ КАРТОЧЕК =============
    const videoCards = document.querySelectorAll('.video-card');
    
    videoCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-12px)';
            this.style.boxShadow = '0 25px 40px -15px #a855f7';
            this.style.borderColor = '#a855f7';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
            this.style.borderColor = '#2d2d3f';
        });
    });
    
    // ============= ПОДСВЕТКА АКТИВНОГО МЕНЮ =============
    const currentLocation = window.location.pathname;
    const navLinks = document.querySelectorAll('.btn-header');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentLocation) {
            link.style.background = '#6b21a8';
            link.style.color = 'white';
        }
    });
    
    // ============= АНИМАЦИЯ ЗАГРУЗКИ СТРАНИЦЫ =============
    const elements = document.querySelectorAll('.video-card, .stat-card, .upload-form');
    
    elements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.5s ease';
        
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 100 + (index * 100));
    });
    
    // ============= ПРОВЕРКА НОВЫХ СООБЩЕНИЙ =============
    function checkFlashMessages() {
        const flashes = document.querySelectorAll('.flash');
        flashes.forEach(flash => {
            setTimeout(() => {
                flash.style.opacity = '0';
                flash.style.transform = 'translateY(-20px)';
                flash.style.transition = 'all 0.5s ease';
                setTimeout(() => flash.remove(), 500);
            }, 5000);
        });
    }
    
    checkFlashMessages();
    
    // ============= ВАЛИДАЦИЯ ФОРМ =============
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const requiredInputs = this.querySelectorAll('[required]');
            let isValid = true;
            
            requiredInputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = '#ef4444';
                    
                    // Подсветка ошибки
                    setTimeout(() => {
                        input.style.borderColor = '#2d2d3f';
                    }, 2000);
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                alert('⚠️ Заполните все обязательные поля');
            }
        });
    });
    
    // ============= КАЛЬКУЛЯТОР ДОХОДА =============
    const earningsElement = document.getElementById('total-earnings');
    if (earningsElement) {
        let currentValue = parseInt(earningsElement.textContent.replace(/[^0-9]/g, ''));
        
        setInterval(() => {
            // Имитация роста дохода
            currentValue += Math.floor(Math.random() * 10);
            earningsElement.textContent = currentValue.toLocaleString() + ' ₽';
            
            // Анимация
            earningsElement.style.transform = 'scale(1.1)';
            earningsElement.style.color = '#a855f7';
            setTimeout(() => {
                earningsElement.style.transform = 'scale(1)';
                earningsElement.style.color = '';
            }, 200);
        }, 30000); // Каждые 30 секунд
    }
    
    // ============= ГОТОВО =============
    console.log('✅ SWILL JavaScript полностью загружен');
});

// ============= ГЛОБАЛЬНЫЙ ОБЪЕКТ SWILL =============
window.SWILL = {
    version: '2.0.0',
    theme: 'dark_purple',
    
    // Обновить статистику вручную
    refreshStats: function() {
        fetch('/api/stats')
            .then(r => r.json())
            .then(data => {
                console.log('📊 Статистика:', data);
                alert(`Видео: ${data.videos}\nПросмотры: ${data.views}\nЗаработано: ${data.earned} ₽`);
            });
    },
    
    // Переключить тему (заглушка)
    toggleTheme: function() {
        alert('💜 Фиолетовая тема всегда включена');
    },
    
    // Показать информацию
    info: function() {
        console.log('⚡ SWILL PREMIUM v2.0');
        console.log('💜 Фиолетовый неон');
        console.log('💰 Принимаем ЮMoney');
    }
};

// Автозапуск информации
setTimeout(() => {
    console.log('💜 SWILL готов к работе. ЮMoney активен.');
}, 1000);