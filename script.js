// Импорт Firebase модулей
import { collection, addDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Ждем инициализации Firebase
    await waitForFirebase();
    
    // Универсальный поиск элементов (поддержка разных вариантов форм)
    const form = document.getElementById('registrationForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const emailInput = document.getElementById('email');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const welcomeUsername = document.getElementById('welcomeUsername');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitLoader = document.getElementById('submitLoader');

    // Элементы формы входа (новый интерфейс)
    let loginForm = document.getElementById('loginForm');
    let loginUsernameInput = document.getElementById('loginUsername');
    let loginPasswordInput = document.getElementById('loginPassword');
    let loginSubmitBtn = document.getElementById('loginSubmitBtn');
    let loginSubmitText = document.getElementById('loginSubmitText');
    let loginSubmitLoader = document.getElementById('loginSubmitLoader');
    let loginSuccessMessage = document.getElementById('loginSuccessMessage');
    let loggedInUsername = document.getElementById('loggedInUsername');

    // Поиск элементов старого интерфейса (с табами)
    if (!loginForm) {
        // Ищем форму входа по другим возможным селекторам
        loginForm = document.querySelector('form[action*="login"]') || 
                   document.querySelector('form') ||
                   document.querySelector('.login-form') ||
                   null;
    }
    
    // Поиск полей email и password (для старого интерфейса)
    if (!loginUsernameInput) {
        const emailInputLogin = document.querySelector('input[type="email"]');
        const passwordInputLogin = document.querySelector('input[type="password"]');
        
        if (emailInputLogin && passwordInputLogin) {
            // Создаём виртуальные элементы для совместимости
            loginUsernameInput = emailInputLogin;
            loginPasswordInput = passwordInputLogin;
            
            // Ищем кнопку входа
            const loginBtn = emailInputLogin.closest('form')?.querySelector('button[type="submit"]') ||
                           emailInputLogin.closest('form')?.querySelector('button') ||
                           document.querySelector('button:contains("Войти")');
            
            if (loginBtn && !loginSubmitBtn) {
                loginSubmitBtn = loginBtn;
            }
        }
    }

    const goToRegisterLink = document.getElementById('goToRegisterLink');
    const loginLink = document.getElementById('loginLink');
    
    // Логирование для отладки
    console.log('Найдены элементы:', {
        loginForm: !!loginForm,
        loginUsernameInput: !!loginUsernameInput,
        loginPasswordInput: !!loginPasswordInput,
        loginSubmitBtn: !!loginSubmitBtn
    });

    // Функция ожидания инициализации Firebase
    function waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = setInterval(() => {
                if (window.firebaseReady !== undefined) {
                    clearInterval(checkFirebase);
                    resolve();
                }
            }, 100);
        });
    }

    // Функция показа ошибки
    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 5000);
    }

    // Функция показа/скрытия загрузки (регистрация)
    function setLoading(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            submitText.textContent = 'Регистрация...';
            submitLoader.classList.remove('hidden');
        } else {
            submitBtn.disabled = false;
            submitText.textContent = 'Зарегистрироваться';
            submitLoader.classList.add('hidden');
        }
    }

    // Функция показа/скрытия загрузки (вход)
    function setLoginLoading(isLoading) {
        if (isLoading) {
            loginSubmitBtn.disabled = true;
            loginSubmitText.textContent = 'Вход...';
            loginSubmitLoader.classList.remove('hidden');
        } else {
            loginSubmitBtn.disabled = false;
            loginSubmitText.textContent = 'Войти';
            loginSubmitLoader.classList.add('hidden');
        }
    }

    // Проверка существования пользователя в Firebase
    async function checkUserExists(username) {
        if (!window.firebaseReady || !window.db) {
            return false;
        }

        try {
            const usersRef = collection(window.db, 'users');
            const q = query(usersRef, where('username', '==', username));
            const querySnapshot = await getDocs(q);
            return !querySnapshot.empty;
        } catch (error) {
            console.error('Ошибка проверки пользователя:', error);
            return false;
        }
    }

    // Сохранение пользователя в Firebase
    async function saveUserToFirebase(userData) {
        if (!window.firebaseReady || !window.db) {
            throw new Error('Firebase не настроен');
        }

        try {
            const usersRef = collection(window.db, 'users');
            const docRef = await addDoc(usersRef, userData);
            return docRef.id;
        } catch (error) {
            console.error('Ошибка сохранения в Firebase:', error);
            throw error;
        }
    }

    // Сохранение в localStorage (fallback)
    function saveUserToLocalStorage(userData) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        users.push(userData);
        localStorage.setItem('users', JSON.stringify(users));
    }

    // Поиск пользователя в localStorage по логину или email
    function findUserInLocalStorage(usernameOrEmail) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.find(u => u.username === usernameOrEmail || u.email === usernameOrEmail) || null;
    }

    // Валидация логина
    usernameInput.addEventListener('input', function() {
        const username = this.value.trim();
        const errorElement = document.getElementById('usernameError');
        
        if (username.length < 3 && username.length > 0) {
            errorElement.textContent = 'Логин должен содержать минимум 3 символа';
        } else if (username.length > 20) {
            errorElement.textContent = 'Логин не должен превышать 20 символов';
        } else if (!/^[a-zA-Z0-9_]+$/.test(username) && username.length > 0) {
            errorElement.textContent = 'Логин может содержать только буквы, цифры и подчеркивание';
        } else {
            errorElement.textContent = '';
        }
    });

    // Валидация пароля
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const errorElement = document.getElementById('passwordError');
        
        if (password.length < 6 && password.length > 0) {
            errorElement.textContent = 'Пароль должен содержать минимум 6 символов';
        } else {
            errorElement.textContent = '';
        }
    });

    // Валидация подтверждения пароля
    confirmPasswordInput.addEventListener('input', function() {
        const password = passwordInput.value;
        const confirmPassword = this.value;
        const errorElement = document.getElementById('confirmPasswordError');
        
        if (confirmPassword && password !== confirmPassword) {
            errorElement.textContent = 'Пароли не совпадают';
        } else {
            errorElement.textContent = '';
        }
    });

    // Обработка отправки формы регистрации
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const email = emailInput.value.trim();

        // Очистка предыдущих ошибок
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
        });
        errorMessage.classList.add('hidden');

        let hasErrors = false;

        // Валидация логина
        if (username.length < 3) {
            document.getElementById('usernameError').textContent = 'Логин должен содержать минимум 3 символа';
            hasErrors = true;
        } else if (username.length > 20) {
            document.getElementById('usernameError').textContent = 'Логин не должен превышать 20 символов';
            hasErrors = true;
        } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            document.getElementById('usernameError').textContent = 'Логин может содержать только буквы, цифры и подчеркивание';
            hasErrors = true;
        }

        // Валидация пароля
        if (password.length < 6) {
            document.getElementById('passwordError').textContent = 'Пароль должен содержать минимум 6 символов';
            hasErrors = true;
        }

        // Валидация подтверждения пароля
        if (password !== confirmPassword) {
            document.getElementById('confirmPasswordError').textContent = 'Пароли не совпадают';
            hasErrors = true;
        }

        // Валидация email (если указан)
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            hasErrors = true;
            emailInput.style.borderColor = '#e74c3c';
        } else if (email) {
            emailInput.style.borderColor = '#e0e0e0';
        }

        if (hasErrors) {
            return;
        }

        setLoading(true);

        try {
            // Если указан email, пробуем зарегистрировать через Firebase Authentication
            if (email && window.firebaseReady && window.auth) {
                try {
                    const userCredential = await createUserWithEmailAndPassword(window.auth, email, password);
                    console.log('Пользователь зарегистрирован через Firebase Authentication');
                    
                    // Сохраняем дополнительную информацию в Firestore
                    const userData = {
                        username: username,
                        email: email,
                        uid: userCredential.user.uid,
                        registeredAt: new Date().toISOString()
                    };
                    
                    if (window.db) {
                        try {
                            await saveUserToFirebase(userData);
                        } catch (err) {
                            console.warn('Не удалось сохранить в Firestore, но пользователь создан в Auth');
                        }
                    }
                    
                    // Показ сообщения об успехе
                    welcomeUsername.textContent = username || email;
                    successMessage.classList.remove('hidden');
                    form.reset();
                    
                    setTimeout(() => {
                        successMessage.classList.add('hidden');
                    }, 5000);
                    
                    setLoading(false);
                    return;
                } catch (authError) {
                    if (authError.code === 'auth/email-already-in-use') {
                        document.getElementById('email').style.borderColor = '#e74c3c';
                        showError('Пользователь с таким email уже зарегистрирован');
                        setLoading(false);
                        return;
                    } else if (authError.code === 'auth/invalid-email') {
                        document.getElementById('email').style.borderColor = '#e74c3c';
                        showError('Неверный формат email');
                        setLoading(false);
                        return;
                    } else if (authError.code === 'auth/weak-password') {
                        document.getElementById('passwordError').textContent = 'Пароль слишком слабый';
                        setLoading(false);
                        return;
                    }
                    console.warn('Ошибка Firebase Auth, используем обычную регистрацию:', authError);
                }
            }

            // Проверка существования пользователя
            const userExists = await checkUserExists(username);
            if (userExists) {
                showError('Пользователь с таким логином уже существует');
                document.getElementById('usernameError').textContent = 'Этот логин уже занят';
                setLoading(false);
                return;
            }

        // Подготовка данных пользователя
        // ВАЖНО: В реальном приложении пароль должен быть захеширован на сервере!
        const userData = {
            username: username,
            password: password, // простой вариант для демо, не для продакшена
            email: email || null,
            registeredAt: new Date().toISOString()
        };

            // Попытка сохранения в Firebase
            let saved = false;
            if (window.firebaseReady && window.db) {
                try {
                    await saveUserToFirebase(userData);
                    saved = true;
                    console.log('Пользователь сохранен в Firebase');
                } catch (firebaseError) {
                    console.warn('Ошибка сохранения в Firebase, используется localStorage:', firebaseError);
                    saveUserToLocalStorage(userData);
                }
            } else {
                // Fallback на localStorage
                saveUserToLocalStorage(userData);
                console.log('Пользователь сохранен в localStorage (Firebase не настроен)');
            }

            // Показ сообщения об успехе
            welcomeUsername.textContent = username;
            successMessage.classList.remove('hidden');
            form.reset();

            // Скрытие сообщения через 5 секунд
            setTimeout(() => {
                successMessage.classList.add('hidden');
            }, 5000);

        } catch (error) {
            console.error('Ошибка регистрации:', error);
            showError('Произошла ошибка при регистрации. Попробуйте еще раз.');
        } finally {
            setLoading(false);
        }
    });

    // Обработка отправки формы входа (универсальная)
    if (loginForm && loginUsernameInput && loginPasswordInput) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Форма входа отправлена');

            const usernameOrEmail = loginUsernameInput.value.trim();
            const password = loginPasswordInput.value;
            
            console.log('Данные для входа:', { usernameOrEmail: usernameOrEmail.substring(0, 3) + '...', passwordLength: password.length });

            document.getElementById('loginUsernameError').textContent = '';
            document.getElementById('loginPasswordError').textContent = '';
            loginSuccessMessage.classList.add('hidden');

            if (!usernameOrEmail) {
                document.getElementById('loginUsernameError').textContent = 'Введите логин или email';
                return;
            }
            if (!password) {
                document.getElementById('loginPasswordError').textContent = 'Введите пароль';
                return;
            }

            setLoginLoading(true);

            try {
                let user = null;
                let isEmail = usernameOrEmail.includes('@');

                // Если это email и Firebase Auth доступен - пробуем через Firebase Authentication
                if (isEmail && window.firebaseReady && window.auth) {
                    try {
                        const userCredential = await signInWithEmailAndPassword(window.auth, usernameOrEmail, password);
                        user = {
                            username: userCredential.user.email,
                            email: userCredential.user.email,
                            id: userCredential.user.uid
                        };
                        console.log('Вход через Firebase Authentication успешен');
                    } catch (authError) {
                        console.warn('Ошибка Firebase Auth, пробуем другие методы:', authError);
                        // Продолжаем поиск в Firestore/localStorage
                    }
                }

                // Если не вошли через Auth, ищем в Firestore по username или email
                if (!user && window.firebaseReady && window.db) {
                    try {
                        const usersRef = collection(window.db, 'users');
                        let q;
                        if (isEmail) {
                            q = query(usersRef, where('email', '==', usernameOrEmail));
                        } else {
                            q = query(usersRef, where('username', '==', usernameOrEmail));
                        }
                        const querySnapshot = await getDocs(q);
                        if (!querySnapshot.empty) {
                            const doc = querySnapshot.docs[0];
                            const data = doc.data();
                            user = { id: doc.id, ...data };
                            
                            // Проверяем пароль
                            if (!user.password || user.password !== password) {
                                document.getElementById('loginPasswordError').textContent = 'Неверный пароль';
                                setLoginLoading(false);
                                return;
                            }
                        }
                    } catch (err) {
                        console.warn('Ошибка чтения из Firebase, пробуем localStorage:', err);
                    }
                }

                // Если в Firebase не нашли или он не настроен — ищем в localStorage
                if (!user) {
                    user = findUserInLocalStorage(usernameOrEmail);
                    if (user && (!user.password || user.password !== password)) {
                        document.getElementById('loginPasswordError').textContent = 'Неверный пароль';
                        setLoginLoading(false);
                        return;
                    }
                }

                if (!user) {
                    document.getElementById('loginUsernameError').textContent = 'Пользователь не найден';
                    setLoginLoading(false);
                    return;
                }

                // Успешный вход
                localStorage.setItem('currentUser', JSON.stringify({
                    username: user.username || user.email,
                    email: user.email,
                    loggedInAt: new Date().toISOString()
                }));

                loggedInUsername.textContent = user.username || user.email;
                loginSuccessMessage.classList.remove('hidden');

            } catch (err) {
                console.error('Ошибка при входе:', err);
                if (err.code === 'auth/user-not-found') {
                    document.getElementById('loginUsernameError').textContent = 'Пользователь не найден';
                } else if (err.code === 'auth/wrong-password') {
                    document.getElementById('loginPasswordError').textContent = 'Неверный пароль';
                } else if (err.code === 'auth/invalid-email') {
                    document.getElementById('loginUsernameError').textContent = 'Неверный формат email';
                } else {
                    showError('Произошла ошибка при входе. Попробуйте ещё раз.');
                }
            } finally {
                setLoginLoading(false);
            }
        });
    }

    // Переход "Уже есть аккаунт? Войти"
    if (loginLink) {
        loginLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (loginUsernameInput) {
                loginUsernameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                loginUsernameInput.focus();
            }
        });
    }

    // Переход "Нет аккаунта? Зарегистрироваться"
    if (goToRegisterLink) {
        goToRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (usernameInput) {
                usernameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                usernameInput.focus();
            }
        });
    }

    // Универсальный обработчик для всех форм входа на странице
    // Ищем все формы, которые могут быть формами входа
    const allForms = document.querySelectorAll('form');
    allForms.forEach(form => {
        // Пропускаем уже обработанные формы
        if (form === loginForm || form === form) return;
        
        // Проверяем, есть ли в форме поля email и password
        const emailField = form.querySelector('input[type="email"]');
        const passwordField = form.querySelector('input[type="password"]');
        const submitButton = form.querySelector('button[type="submit"]') || form.querySelector('button');
        
        if (emailField && passwordField && submitButton) {
            console.log('Найдена форма входа:', form);
            
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                console.log('Обработка универсальной формы входа');
                
                const email = emailField.value.trim();
                const password = passwordField.value;
                
                if (!email) {
                    alert('Введите email');
                    return;
                }
                if (!password) {
                    alert('Введите пароль');
                    return;
                }
                
                // Блокируем кнопку
                submitButton.disabled = true;
                const originalText = submitButton.textContent;
                submitButton.textContent = 'Вход...';
                
                try {
                    // Пробуем войти через Firebase Authentication
                    if (window.firebaseReady && window.auth) {
                        try {
                            const userCredential = await signInWithEmailAndPassword(window.auth, email, password);
                            console.log('Вход успешен через Firebase Auth');
                            alert('Вход выполнен! Добро пожаловать, ' + userCredential.user.email);
                            
                            // Сохраняем информацию о входе
                            localStorage.setItem('currentUser', JSON.stringify({
                                email: userCredential.user.email,
                                uid: userCredential.user.uid,
                                loggedInAt: new Date().toISOString()
                            }));
                            
                            // Перезагружаем страницу или перенаправляем
                            window.location.reload();
                            return;
                        } catch (authError) {
                            console.error('Ошибка Firebase Auth:', authError);
                            if (authError.code === 'auth/user-not-found') {
                                alert('Пользователь не найден. Зарегистрируйтесь сначала.');
                            } else if (authError.code === 'auth/wrong-password') {
                                alert('Неверный пароль');
                            } else if (authError.code === 'auth/invalid-email') {
                                alert('Неверный формат email');
                            } else {
                                alert('Ошибка входа: ' + authError.message);
                            }
                        }
                    } else {
                        alert('Firebase не настроен. Проверьте конфигурацию.');
                    }
                } catch (err) {
                    console.error('Ошибка при входе:', err);
                    alert('Произошла ошибка при входе. Попробуйте ещё раз.');
                } finally {
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;
                }
            });
        }
    });
    
    console.log('Все обработчики форм установлены');
});
