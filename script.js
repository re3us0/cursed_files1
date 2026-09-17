(function() {
    'use strict';

    var movies = [];
    var editIndex = -1;
    var viewIndex = -1;

    function loadMovies() {
        try {
            var saved = localStorage.getItem('movies');
            if (saved) movies = JSON.parse(saved);
        } catch(e) { movies = []; }
    }

    function saveMovies() {
        localStorage.setItem('movies', JSON.stringify(movies));
    }

    function getDefaultMovies() {
        return [
            { title: 'Интерстеллар', year: '2014', rating: '10', poster: 'images/interstellar.jpg', status: 'watched', description: 'Фантастика о путешествии сквозь червоточину.', comment: 'Один из лучших фильмов Нолана!' },
            { title: 'Побег из Шоушенка', year: '1994', rating: '10', poster: 'images/schawshank.jpg', status: 'watched', description: 'История о надежде и дружбе в тюрьме.', comment: 'Классика на все времена.' },
            { title: 'Крёстный отец', year: '1972', rating: '9', poster: 'images/godfather.jpg', status: 'watched', description: 'Криминальная драма о семье Корлеоне.', comment: 'Марлон Брандо — легенда.' },
            { title: 'Тёмный рыцарь', year: '2008', rating: '9', poster: 'images/dark-knight.jpg', status: 'watched', description: 'Бэтмен против Джокера.', comment: 'Хит Леджер — лучший Джокер.' },
            { title: 'Криминальное чтиво', year: '1994', rating: '9', poster: 'images/pulp-fiction.jpg', status: 'watched', description: 'Несколько историй в одном фильме.', comment: 'Тарантино в лучшей форме.' },
            { title: 'Властелин колец: Возвращение короля', year: '2003', rating: '9', poster: 'images/lotr-return.jpg', status: 'watched', description: 'Финальная битва за Средиземье.', comment: 'Эпичное завершение.' },
            { title: 'Бойцовский клуб', year: '1999', rating: '9', poster: 'images/fight-club.jpg', status: 'watched', description: 'Подпольный бойцовский клуб.', comment: 'Мозговыносящий фильм.' },
            { title: 'Начало', year: '2010', rating: '9', poster: 'images/inception.jpg', status: 'watched', description: 'Вор крадёт секреты из снов.', comment: 'Шедевр Нолана.' },
            { title: 'Матрица', year: '1999', rating: '9', poster: 'images/matrix.jpg', status: 'watched', description: 'Мир — симуляция.', comment: 'Революция в кино.' },
            { title: 'Джентльмены', year: '2019', rating: '9', poster: 'images/gentlemen.jpg', status: 'planned', description: 'Криминальная комедия Гая Ричи.', comment: 'Хочу посмотреть.' }
        ];
    }

    var app = document.getElementById('app');
    var modalOverlay = document.getElementById('modalOverlay');
    var modalClose = document.getElementById('modalClose');
    var viewModal = document.getElementById('viewModal');
    var viewClose = document.getElementById('viewClose');
    var shareModal = document.getElementById('shareModal');
    var shareClose = document.getElementById('shareClose');
    var currentPage = 'home';
    var searchTimeout = null;

    function createStarRating(containerId, displayId, initialValue) {
        var container = document.getElementById(containerId);
        if (!container) return null;
        var stars = container.querySelectorAll('.star');
        var display = document.getElementById(displayId);
        var value = initialValue || 0;

        function updateStars(val) {
            stars.forEach(function(star) {
                var starVal = parseInt(star.getAttribute('data-value'));
                if (starVal <= val) star.classList.add('active');
                else star.classList.remove('active');
            });
            if (display) display.textContent = val;
        }

        stars.forEach(function(star) {
            star.addEventListener('click', function() {
                value = parseInt(this.getAttribute('data-value'));
                updateStars(value);
            });
        });

        updateStars(value);

        return {
            getValue: function() { return value; },
            setValue: function(val) { value = val; updateStars(val); }
        };
    }

    var editStarRating = null;

    function openEditModal(index) {
        editIndex = index;
        var movie = movies[index];
        document.getElementById('editTitle').value = movie.title;
        document.getElementById('editYear').value = movie.year;
        document.getElementById('editPoster').value = movie.poster || '';
        document.getElementById('editStatus').value = movie.status;
        document.getElementById('editDescription').value = movie.description || '';
        document.getElementById('editComment').value = movie.comment || '';
        document.getElementById('editPosterPreview').src = movie.poster || 'images/placeholder.jpg';

        if (editStarRating) editStarRating.setValue(parseInt(movie.rating) || 0);

        modalOverlay.classList.add('active');
    }

    function closeEditModal() {
        modalOverlay.classList.remove('active');
        editIndex = -1;
    }

    function openViewModal(index) {
        viewIndex = index;
        var movie = movies[index];
        document.getElementById('viewTitle').textContent = movie.title;
        document.getElementById('viewPoster').src = movie.poster || 'images/placeholder.jpg';
        document.getElementById('viewYear').textContent = '📅 ' + movie.year;
        
        var stars = '';
        var r = parseInt(movie.rating) || 0;
        for (var i = 1; i <= 10; i++) stars += (i <= r) ? '⭐' : '☆';
        document.getElementById('viewRating').textContent = stars + '  ' + movie.rating + '/10';
        
        document.getElementById('viewStatus').textContent = (movie.status === 'watched') ? '✅ Просмотрен' : '⏳ В планах';
        document.getElementById('viewDescription').textContent = movie.description || 'Описание не добавлено';
        document.getElementById('viewComment').textContent = movie.comment || 'Заметок нет';

        viewModal.classList.add('active');
    }

    function closeViewModal() {
        viewModal.classList.remove('active');
        viewIndex = -1;
    }
    function renderHome() {
        currentPage = 'home';
        updateActiveButton('home');

        var total = movies.length;
        var watched = 0, planned = 0;
        movies.forEach(function(m) {
            if (m.status === 'watched') watched++;
            else planned++;
        });

        var topMovies = movies
            .filter(function(m) { return m.rating !== '?' && m.rating !== ''; })
            .sort(function(a, b) { return parseInt(b.rating) - parseInt(a.rating); })
            .slice(0, 5);

        var html = '';

        html += '<section class="hero"><div class="hero-content">';
        html += '<div class="hero-badge">🎬 Добро пожаловать</div>';
        html += '<h1>Твоя личная<br>коллекция фильмов</h1>';
        html += '<p>Отслеживай, оценивай, делись с друзьями.</p>';
        html += '<div class="hero-buttons">';
        html += '<button class="btn-primary" id="heroCollectionBtn">🎥 Моя коллекция</button>';
        html += '<button class="btn-secondary" id="heroAddBtn">➕ Добавить фильм</button>';
        html += '</div></div></section>';

        html += '<section class="quick-stats">';
        html += '<div class="quick-stat" id="qsTotal"><div class="icon">🎬</div><div class="number">' + total + '</div><div class="label">Всего фильмов</div></div>';
        html += '<div class="quick-stat" id="qsWatched"><div class="icon">✅</div><div class="number">' + watched + '</div><div class="label">Просмотрено</div></div>';
        html += '<div class="quick-stat" id="qsPlanned"><div class="icon">⏳</div><div class="number">' + planned + '</div><div class="label">В планах</div></div>';
        html += '<div class="quick-stat" id="qsStats"><div class="icon">📊</div><div class="number">→</div><div class="label">Статистика</div></div>';
        html += '</section>';

        if (topMovies.length > 0) {
            html += '<section class="top-movies"><h2>⭐ Топ-5 по рейтингу</h2><div class="top-movies-grid">';
            topMovies.forEach(function(movie, i) {
                var realIndex = movies.indexOf(movie);
                html += '<div class="top-movie-card" data-index="' + realIndex + '">';
                html += '<div class="rank">' + (i + 1) + '</div>';
                html += '<img src="' + (movie.poster || 'images/placeholder.jpg') + '" onerror="this.src=\'images/placeholder.jpg\'">';
                html += '<div class="top-info"><h4>' + movie.title + '</h4>';
                html += '<div class="top-rating">⭐ ' + movie.rating + ' / 10</div></div></div>';
            });
            html += '</div></section>';
        }

        html += '<section class="features"><h2>Всё для твоей коллекции</h2>';
        html += '<p class="subtitle">Управляй фильмами легко и удобно</p>';
        html += '<div class="features-grid">';
        html += '<div class="feature-card"><div class="feature-icon">➕</div><h3>Добавляй</h3><p>Сохраняй фильмы с постером, годом и оценкой</p></div>';
        html += '<div class="feature-card"><div class="feature-icon">⭐</div><h3>Оценивай</h3><p>Ставь звёздный рейтинг каждому фильму</p></div>';
        html += '<div class="feature-card"><div class="feature-icon">💭</div><h3>Записывай</h3><p>Оставляй личные заметки и описания</p></div>';
        html += '<div class="feature-card"><div class="feature-icon">🔗</div><h3>Делись</h3><p>Экспортируй и делись с друзьями</p></div>';
        html += '</div></section>';

        app.innerHTML = html;

        var heroCollectionBtn = document.getElementById('heroCollectionBtn');
        var heroAddBtn = document.getElementById('heroAddBtn');
        if (heroCollectionBtn) heroCollectionBtn.addEventListener('click', function() { navigateTo('collection'); });
        if (heroAddBtn) heroAddBtn.addEventListener('click', function() { navigateTo('add'); });

        var qsTotal = document.getElementById('qsTotal');
        var qsWatched = document.getElementById('qsWatched');
        var qsPlanned = document.getElementById('qsPlanned');
        var qsStats = document.getElementById('qsStats');
        if (qsTotal) qsTotal.addEventListener('click', function() { navigateTo('collection'); });
        if (qsWatched) qsWatched.addEventListener('click', function() { navigateTo('collection'); });
        if (qsPlanned) qsPlanned.addEventListener('click', function() { navigateTo('collection'); });
        if (qsStats) qsStats.addEventListener('click', function() { navigateTo('stats'); });

        document.querySelectorAll('.top-movie-card').forEach(function(card) {
            card.addEventListener('click', function() {
                var index = parseInt(this.getAttribute('data-index'));
                openViewModal(index);
            });
        });
    }

    function renderCollectionPage() {
        currentPage = 'collection';
        updateActiveButton('collection');

        var html = '';
        html += '<div class="controls">';
        html += '<input type="text" id="searchInput" placeholder="🔍 Поиск по названию..." autocomplete="off">';
        html += '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">';
        html += '<label for="sortSelect" style="color:#a0aaba;font-weight:600;">Сортировка:</label>';
        html += '<select id="sortSelect">';
        html += '<option value="newest">📅 Сначала новые</option>';
        html += '<option value="oldest">📅 Сначала старые</option>';
        html += '<option value="rating-high">⭐ По рейтингу (выс.)</option>';
        html += '<option value="rating-low">⭐ По рейтингу (низ.)</option>';
        html += '<option value="alphabet">🔤 По названию (А-Я)</option>';
        html += '</select>';
        html += '</div></div>';
        html += '<div id="movieContainer"></div>';

        app.innerHTML = html;

        var searchInput = document.getElementById('searchInput');
        var sortSelect = document.getElementById('sortSelect');

        if (searchInput) {
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(renderMovieList, 200);
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', renderMovieList);
        }

        renderMovieList();
    }

    function renderMovieList() {
        var searchInput = document.getElementById('searchInput');
        var sortSelect = document.getElementById('sortSelect');
        var container = document.getElementById('movieContainer');

        if (!container) return;

        var query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        var sortType = sortSelect ? sortSelect.value : 'newest';

        var filtered = movies.filter(function(movie) {
            return movie.title.toLowerCase().indexOf(query) !== -1;
        });

        if (sortType === 'newest') {
            filtered.sort(function(a, b) {
                var ya = (a.year === 'Не указан' || a.year === '') ? 0 : parseInt(a.year);
                var yb = (b.year === 'Не указан' || b.year === '') ? 0 : parseInt(b.year);
                return yb - ya;
            });
        } else if (sortType === 'oldest') {
            filtered.sort(function(a, b) {
                var ya = (a.year === 'Не указан' || a.year === '') ? 9999 : parseInt(a.year);
                var yb = (b.year === 'Не указан' || b.year === '') ? 9999 : parseInt(b.year);
                return ya - yb;
            });
        } else if (sortType === 'rating-high') {
            filtered.sort(function(a, b) {
                var ra = (a.rating === '?' || a.rating === '') ? 0 : parseInt(a.rating);
                var rb = (b.rating === '?' || b.rating === '') ? 0 : parseInt(b.rating);
                return rb - ra;
            });
        } else if (sortType === 'rating-low') {
            filtered.sort(function(a, b) {
                var ra = (a.rating === '?' || a.rating === '') ? 999 : parseInt(a.rating);
                var rb = (b.rating === '?' || b.rating === '') ? 999 : parseInt(b.rating);
                return ra - rb;
            });
        } else if (sortType === 'alphabet') {
            filtered.sort(function(a, b) {
                return a.title.localeCompare(b.title, 'ru');
            });
        }

        if (filtered.length === 0) {
            var msg = (movies.length === 0) ? '🎥 Нет фильмов. Добавь свой первый!' : '🔍 Ничего не найдено';
            container.innerHTML = '<div class="empty-message">' + msg + '</div>';
            return;
        }

        var gridHtml = '<div class="movie-grid">';
        filtered.forEach(function(movie) {
            var realIndex = movies.indexOf(movie);
            var poster = movie.poster || 'images/placeholder.jpg';
            var statusText = (movie.status === 'watched') ? '✅ Просмотрен' : '⏳ В планах';

            var stars = '';
            var ratingNum = parseInt(movie.rating) || 0;
            for (var i = 1; i <= 10; i++) {
                stars += (i <= ratingNum) ? '⭐' : '☆';
            }

            var commentPreview = movie.comment ? '<div class="comment-preview">💭 ' + movie.comment.substring(0, 60) + (movie.comment.length > 60 ? '...' : '') + '</div>' : '';

            gridHtml += '<div class="movie-card" data-index="' + realIndex + '">';
            gridHtml += '<img src="' + poster + '" alt="' + movie.title + '" onerror="this.src=\'images/placeholder.jpg\'">';
            gridHtml += '<div class="movie-info">';
            gridHtml += '<h3>' + movie.title + '</h3>';
            gridHtml += '<div class="year">' + movie.year + '</div>';
            gridHtml += '<div style="font-size:14px;letter-spacing:2px;">' + stars + '</div>';
            gridHtml += '<div><span class="status">' + statusText + '</span></div>';
            gridHtml += commentPreview;
            gridHtml += '<button class="delete-btn" data-index="' + realIndex + '">🗑 Удалить</button>';
            gridHtml += '</div></div>';
        });
        gridHtml += '</div>';
        container.innerHTML = gridHtml;

        document.querySelectorAll('.movie-card').forEach(function(card) {
            card.addEventListener('click', function(e) {
                if (e.target.classList.contains('delete-btn')) return;
                var index = parseInt(this.getAttribute('data-index'));
                openViewModal(index);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var idx = parseInt(this.getAttribute('data-index'));
                if (confirm('Удалить фильм "' + movies[idx].title + '"?')) {
                    movies.splice(idx, 1);
                    saveMovies();
                    renderMovieList();
                }
            });
        });
    }

    function renderAdd() {
        currentPage = 'add';
        updateActiveButton('add');

        var html = '';
        html += '<div class="add-form">';
        html += '<h2 style="margin-bottom:10px;">➕ Добавить фильм</h2>';
        html += '<form id="movieForm">';
        html += '<label>Название *</label>';
        html += '<input type="text" id="title" required placeholder="Например: Интерстеллар">';
        html += '<label>Год выпуска</label>';
        html += '<input type="number" id="year" placeholder="2014">';
        html += '<label>Оценка (звёзды)</label>';
        html += '<div class="star-rating" id="addStarRating">';
        html += '<span class="star" data-value="1">☆</span>';
        html += '<span class="star" data-value="2">☆</span>';
        html += '<span class="star" data-value="3">☆</span>';
        html += '<span class="star" data-value="4">☆</span>';
        html += '<span class="star" data-value="5">☆</span>';
        html += '<span class="star" data-value="6">☆</span>';
        html += '<span class="star" data-value="7">☆</span>';
        html += '<span class="star" data-value="8">☆</span>';
        html += '<span class="star" data-value="9">☆</span>';
        html += '<span class="star" data-value="10">☆</span>';
        html += '<span id="addRatingDisplay" style="margin-left:15px;font-weight:700;color:#f5c842;">0</span>';
        html += '</div>';
        html += '<label>Описание фильма</label>';
        html += '<textarea id="description" rows="3" placeholder="О чём фильм?"></textarea>';
        html += '<label>Мои заметки</label>';
        html += '<textarea id="comment" rows="3" placeholder="Что ты думаешь об этом фильме?"></textarea>';
        html += '<label>Ссылка на постер</label>';
        html += '<input type="text" id="poster" placeholder="images/movie.jpg или https://...">';
        html += '<label>Статус</label>';
        html += '<select id="status">';
        html += '<option value="watched">✅ Просмотрен</option>';
        html += '<option value="planned">⏳ В планах</option>';
        html += '</select>';
        html += '<button type="submit" class="submit-btn">➕ Сохранить фильм</button>';
        html += '</form></div>';

        app.innerHTML = html;

        var addRating = createStarRating('addStarRating', 'addRatingDisplay', 0);

        var form = document.getElementById('movieForm');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();

                var title = document.getElementById('title').value.trim();
                if (!title) {
                    alert('Название обязательно!');
                    return;
                }

                movies.push({
                    title: title,
                    year: document.getElementById('year').value || 'Не указан',
                    rating: addRating ? addRating.getValue() : '?',
                    poster: document.getElementById('poster').value.trim() || 'images/placeholder.jpg',
                    status: document.getElementById('status').value,
                    description: document.getElementById('description').value.trim(),
                    comment: document.getElementById('comment').value.trim()
                });

                saveMovies();
                alert('✅ Фильм добавлен!');
                navigateTo('collection');
            });
        }
    }

    function renderStats() {
        currentPage = 'stats';
        updateActiveButton('stats');

        var total = movies.length;
        var watched = 0, planned = 0;
        movies.forEach(function(m) {
            if (m.status === 'watched') watched++;
            else planned++;
        });

        var sum = 0, count = 0;
        movies.forEach(function(m) {
            if (m.rating !== '?' && m.rating !== '' && !isNaN(m.rating)) {
                sum += parseInt(m.rating);
                count++;
            }
        });

        var avg = (count > 0) ? (sum / count).toFixed(1) : '—';

        var html = '';
        html += '<h2>📊 Моя статистика</h2>';
        html += '<div class="stats-block">';
        html += '<div class="stat-item"><div class="number">' + total + '</div><div class="label">Всего фильмов</div></div>';
        html += '<div class="stat-item"><div class="number">' + watched + '</div><div class="label">✅ Просмотрено</div></div>';
        html += '<div class="stat-item"><div class="number">' + planned + '</div><div class="label">⏳ В планах</div></div>';
        html += '<div class="stat-item"><div class="number">' + avg + '</div><div class="label">⭐ Средний рейтинг</div></div>';
        html += '</div>';
        html += '<p style="color:#a0aaba;text-align:center;margin-top:20px;">' + (total > 0 ? 'Продолжай пополнять коллекцию!' : 'Пока нет фильмов 😕') + '</p>';

        app.innerHTML = html;
    }

    function navigateTo(page) {
        if (page === 'home') renderHome();
        else if (page === 'collection') renderCollectionPage();
        else if (page === 'add') renderAdd();
        else if (page === 'stats') renderStats();
    }

    function updateActiveButton(page) {
        document.querySelectorAll('.nav-btn').forEach(function(btn) {
            btn.classList.remove('active');
            if (btn.getAttribute('data-page') === page) btn.classList.add('active');
        });
    }
    // ===== ЗАПУСК =====
    document.addEventListener('DOMContentLoaded', function() {
        loadMovies();
        if (movies.length === 0) {
            movies = getDefaultMovies();
            saveMovies();
        }

        // Кнопка сброса
        var resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                if (confirm('⚠️ Сбросить все фильмы и загрузить стартовый набор?')) {
                    movies = getDefaultMovies();
                    saveMovies();
                    renderCurrentPage();
                    alert('✅ Данные сброшены!');
                }
            });
        }

        // Навигация
        document.querySelectorAll('.nav-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var page = this.getAttribute('data-page');
                if (page) navigateTo(page);
            });
        });

        // Кнопка "Поделиться"
        var shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', function() {
                var link = window.location.href;
                document.getElementById('shareLink').value = link;
                shareModal.classList.add('active');
            });
        }

        if (shareClose) {
            shareClose.addEventListener('click', function() {
                shareModal.classList.remove('active');
            });
        }

        if (shareModal) {
            shareModal.addEventListener('click', function(e) {
                if (e.target === shareModal) shareModal.classList.remove('active');
            });
        }

        // Копировать ссылку
        var copyLinkBtn = document.getElementById('copyLinkBtn');
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', function() {
                var linkInput = document.getElementById('shareLink');
                linkInput.select();
                document.execCommand('copy');
                alert('✅ Ссылка скопирована!');
            });
        }

        // Экспорт JSON
        var exportJsonBtn = document.getElementById('exportJsonBtn');
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', function() {
                var data = JSON.stringify(movies, null, 2);
                document.getElementById('importJson').value = data;
                document.getElementById('importJson').select();
                document.execCommand('copy');
                alert('✅ JSON скопирован в буфер обмена! Отправь другу.');
            });
        }

        // Импорт JSON
        var importJsonBtn = document.getElementById('importJsonBtn');
        if (importJsonBtn) {
            importJsonBtn.addEventListener('click', function() {
                var text = document.getElementById('importJson').value.trim();
                if (!text) {
                    alert('Вставь JSON!');
                    return;
                }
                try {
                    var imported = JSON.parse(text);
                    if (Array.isArray(imported)) {
                        if (confirm('Добавить ' + imported.length + ' фильмов к твоей коллекции?')) {
                            movies = movies.concat(imported);
                            saveMovies();
                            alert('✅ Импортировано ' + imported.length + ' фильмов!');
                            shareModal.classList.remove('active');
                            renderCurrentPage();
                        }
                    } else {
                        alert('Неверный формат JSON');
                    }
                } catch(e) {
                    alert('Ошибка: ' + e.message);
                }
            });
        }

        // Модалка редактирования
        if (modalClose) modalClose.addEventListener('click', closeEditModal);
        if (modalOverlay) {
            modalOverlay.addEventListener('click', function(e) {
                if (e.target === modalOverlay) closeEditModal();
            });
        }

        // Модалка просмотра
        if (viewClose) viewClose.addEventListener('click', closeViewModal);
        if (viewModal) {
            viewModal.addEventListener('click', function(e) {
                if (e.target === viewModal) closeViewModal();
            });
        }

        // Кнопка "Редактировать" в просмотре
        var viewEditBtn = document.getElementById('viewEditBtn');
        if (viewEditBtn) {
            viewEditBtn.addEventListener('click', function() {
                var idx = viewIndex;
                closeViewModal();
                openEditModal(idx);
            });
        }

        // Превью постера в редактировании
        var editPosterInput = document.getElementById('editPoster');
        if (editPosterInput) {
            editPosterInput.addEventListener('input', function() {
                document.getElementById('editPosterPreview').src = this.value || 'images/placeholder.jpg';
            });
        }

        // Инициализация звёзд в редактировании
        editStarRating = createStarRating('editStarRating', 'editRatingDisplay', 0);

        // Сохранение в редактировании
        var editForm = document.getElementById('editForm');
        if (editForm) {
            editForm.addEventListener('submit', function(e) {
                e.preventDefault();
                if (editIndex === -1) return;

                var title = document.getElementById('editTitle').value.trim();
                if (!title) {
                    alert('Название обязательно!');
                    return;
                }

                movies[editIndex] = {
                    title: title,
                    year: document.getElementById('editYear').value || 'Не указан',
                    rating: editStarRating ? editStarRating.getValue() : '?',
                    poster: document.getElementById('editPoster').value.trim() || 'images/placeholder.jpg',
                    status: document.getElementById('editStatus').value,
                    description: document.getElementById('editDescription').value.trim(),
                    comment: document.getElementById('editComment').value.trim()
                };

                saveMovies();
                closeEditModal();
                renderCurrentPage();
                alert('✅ Фильм обновлён!');
            });
        }

        // Удаление из редактирования
        var modalDelete = document.getElementById('modalDelete');
        if (modalDelete) {
            modalDelete.addEventListener('click', function() {
                if (editIndex === -1) return;
                if (confirm('Удалить фильм "' + movies[editIndex].title + '"?')) {
                    movies.splice(editIndex, 1);
                    saveMovies();
                    closeEditModal();
                    renderCurrentPage();
                    alert('🗑 Фильм удалён!');
                }
            });
        }

        // Первый рендер
        renderHome();
    });

    function renderCurrentPage() {
        if (currentPage === 'home') renderHome();
        else if (currentPage === 'collection') renderCollectionPage();
        else if (currentPage === 'add') renderAdd();
        else if (currentPage === 'stats') renderStats();
    }

})();