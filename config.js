// Инициализация Telegram вынесена сюда, чтобы db.js видел isTelegram
let isTelegram = false;
let tgApp = null;
try {
  tgApp = window.Telegram?.WebApp;
  isTelegram = tgApp && tgApp.platform && tgApp.platform !== 'unknown';
  if (isTelegram) {
    tgApp.ready();
    tgApp.expand();
    if (tgApp.disableVerticalSwipes) tgApp.disableVerticalSwipes();
    if (tgApp.setHeaderColor) tgApp.setHeaderColor('#E3F2FD');
    if (tgApp.setBackgroundColor) tgApp.setBackgroundColor('#E3F2FD');
    document.body.classList.add('telegram-mode');
  }
} catch (e) {}

let gameState = 'menu';
let isPortraitMode = window.matchMedia("(orientation: portrait)").matches;
const portraitQuery = window.matchMedia("(orientation: portrait)");

const CURRENT_VERSION = 78;
function formatVersion(v) {
  const thousands = Math.floor(v / 1000);
  const hundreds = Math.floor((v % 1000) / 100);
  const tens = v % 100;
  return `${thousands}.${hundreds}.${tens}`;
}

const CHANGELOG = [
  {
    version: 74,
    changes: [
      'Патч 74: Разрез пасти начинается на вертикали глаза',
      'Удалён участок ротового разреза слева от вертикали глаза',
      'Убраны зубы только из удалённой левой части; геометрия пасти справа от глаза сохранена'
    ]
  },
  {
    version: 73,
    changes: [
      'Патч 73: Исправлены ссылки на ресурсы для обновления кэша',
      'Убраны лишние вопросительные знаки в адресах CSS и JavaScript-файлов',
      'Сохранены изменения формы пасти из патча 72'
    ]
  },
  {
    version: 72,
    changes: [
      'Патч 72: Разрез пасти стал компактнее',
      'Сокращена задняя часть ротового разреза со стороны затылка',
      'Уменьшена высота раскрытия между верхней и нижней челюстью; форма черепа и зубы сохранены'
    ]
  },
  {
    version: 71,
    changes: [
      'Патч 71: Голова T-Rex получила более массивные, хищные пропорции',
      'Череп стал глубже, надбровная область тяжелее, а носовая часть шире и почти прямоугольной с мягко закруглёнными углами',
      'Нижняя челюсть усилена и стала глубже; сохранены плавные костные переходы и выразительная пасть',
      'Корпус, шея, хвост, лапы, анимация и игровая логика не менялись'
    ]
  },
  {
    version: 67,
    changes: [
      'Патч 67: Уточнена анатомия верхней части черепа T-Rex от надбровной области до кончика морды',
      'Надбровная дуга получила более выраженный костный рельеф, а линия переносицы и носовых костей стала плавнее',
      'Ноздря немного увеличена без изменения её расположения относительно кончика морды',
      'Нижняя челюсть, зубы, корпус, хвост, лапы и анимация бега не менялись'
    ]
  },
  {
    version: 66,
    changes: [
      'Патч 66: Нижняя челюсть T-Rex получила более цельный и анатомичный силуэт',
      'Уточнены глубокая передняя часть, плавная линия подбородка и переход к заднему челюстному суставу',
      'Зубы получили разную форму и более естественную посадку вдоль края пасти',
      'Верхняя часть головы, корпус, хвост, лапы и анимация бега не менялись'
    ]
  },

  {
    version: 65,
    changes: [
      'Патч 65: Нижняя челюсть T-Rex перестроена анатомически, верхняя часть головы сохранена',
      'Основание челюсти начинается немного позади глаза и продолжается до кончика морды',
      'Добавлены массивный подбородок и отдельные видимые зубы вдоль края пасти',
      'Убрана длинная линия рта через всю голову; остальные части динозавра не менялись'
    ]
  },
  {
    version: 64,
    changes: [
      'Патч 64: Полностью переработан силуэт головы T-Rex по анатомическим референсам',
      'Череп получил более глубокую заднюю часть, выраженную надбровную дугу и плавно сужающуюся широкую морду',
      'Нижняя челюсть встроена в общий силуэт: массивная у основания и плавно сужается к кончику',
      'Корпус, шея, хвост, шипы, конечности и анимация бега не менялись'
    ]
  },
  {
    version: 63,
    changes: [
      'Патч 63: Нижняя челюсть получила более массивную анатомическую форму T-Rex',
      'Усилен объём задней части челюсти и плавное сужение к кончику морды',
      'Добавлены отдельный контур нижней челюсти, мягкая светотень и более выразительная линия рта',
      'Размер и общая форма черепа, глаз, ноздря, шея, корпус, конечности и анимация не менялись'
    ]
  },
  {
    version: 62,
    changes: [
      'Патч 62: Уменьшена и скруглена форма головы динозавра',
      'Убраны резкие прямоугольные переходы, силуэт черепа и челюсти стал плавнее',
      'Скорректированы пропорции морды, нижней челюсти, глаза и ноздри',
      'Корпус, шея, хвост, шипы, задние лапы и анимация не менялись'
    ]
  },

  {
    version: 61,
    changes: [
      'Патч 61: Гармонизация формы ближней и дальней задних лап',
      'Дальняя лапа теперь повторяет анатомический силуэт ближней с небольшим уменьшением для перспективы',
      'Согласованы объём бедра и голени, форма голеностопа, плюсны, пальцев и когтей',
      'Сохранены перекрытие корпусом, пальцеходящая постановка и опора на пальцы; анимация не менялась'
    ]
  },

  {
    version: 60,
    changes: [
      'Патч 60: Увеличен объём нижней части дальней задней лапы',
      'От колена до голеностопа дальняя лапа стала шире и мускулистее, ближе по анатомии к ближней лапе',
      'Сохранены различие перспективы, пальцеходящий изгиб, поднятая пятка и опора пальцев',
      'Передняя лапа, пальцы, когти и анимация шага не менялись'
    ]
  },
  {
    version: 59,
    changes: [
      'Патч 59: Сбалансированы пропорции дальней задней лапы',
      'Дальняя лапа получила более объёмное бедро и плавный переход к голени, согласованный с ближней лапой',
      'Пальцы обеих задних лап и когти немного удлинены и стали выразительнее',
      'Сохранены пальцеходящий изгиб, поднятая пятка и опора пальцев на землю; анимация не менялась'
    ]
  },
  {
    version: 58,
    changes: [
      'Патч 58: Уточнены пропорции частей задних лап T-Rex',
      'Скорректирована ширина бедра, плавность перехода к голени и объём икроножной части',
      'Уточнены контуры голеностопа и плюсны; сохранён утверждённый пальцеходящий изгиб и опора на пальцы',
      'Анимация и остальные части динозавра не менялись'
    ]
  },
  {
    version: 57,
    changes: [
      'Патч 57: Уточнена пальцеходящая анатомия задних лап T-Rex',
      'Смягчён переход от массивного бедра к голени, добавлен плавный объём икроножной части',
      'Пятка и голеностоп подняты и отведены назад; плюсна направлена вперёд к опорным пальцам',
      'Опора перенесена на подушечки пальцев, а не на всю стопу; анимация не менялась'
    ]
  },
  {
    version: 56,
    changes: [
      'Патч 56: Увеличено бедро и уточнена анатомия голени T-Rex',
      'Бедро стало крупнее и массивнее, колено отделено от сужающейся голени',
      'Голеностоп и стопа опущены до линии земли; нижняя точка подошвы совпадает с базовой линией спрайта',
      'Анимация шага и остальные части динозавра не менялись'
    ]
  },
  {
    version: 55,
    changes: [
      'Патч 55: Переработана анатомическая форма задних лап',
      'Сформированы мощное бедро, выраженное колено и более длинная узкая голень',
      'Стопы стали компактнее, пальцы направлены вперёд',
      'Анимация шага пока не дорабатывалась — приоритетом стала форма лап'
    ]
  },
  {
    version: 54,
    changes: [
      'Патч 54: Исправлена ошибка отрисовки игрового поля',
      'Исправлено обращение к неверной переменной в анимации задних лап',
      'Восстановлено отображение динозавра и сцены в главном меню и игре'
    ]
  },
  {
    version: 53,
    changes: [
      'Патч 53: Анатомическая доработка задних лап T-Rex',
      'Уточнены пропорции бедра, колена и голени; массивность лап уменьшена',
      'Ступни получили более читаемую форму с тремя пальцами и когтями',
      'Улучшено чередование опоры и переноса лап в четырёх фазах бега'
    ]
  },
  {
    version: 52,
    changes: [
      'Патч 52: Возвращена линия позвоночника и смягчены шипы',
      'На хвост возвращена тёмно-зелёная линия, совпадающая по цвету с контуром спины',
      'Высота всех спинных шипов слегка уменьшена без изменения их оснований и плавного градиента'
    ]
  },
  {
    version: 51,
    changes: [
      'Патч 51: Посадка спинных шипов по силуэту',
      'Шипы от середины спины к основанию хвоста немного приподняты',
      'Шипы от середины спины к шее опущены ближе к поверхности тела'
    ]
  },
  {
    version: 50,
    changes: [
      'Патч 50: Исправлена форма спинных шипов',
      'Шипы снова выступают вверх от поверхности тела, а не выглядят плоским узором',
      'Основания выровнены по верхнему силуэту хвоста и спины; наибольшая высота — в середине спины'
    ]
  },
  {
    version: 49,
    changes: [
      'Патч 49: Непрерывный ряд спинных шипов',
      'Самые крупные шипы расположены в середине спины, размер плавно уменьшается к кончику хвоста и к шее',
      'Восстановлены хорошо заметные шипы по всей длине хвоста и в зоне соединения с туловищем'
    ]
  },
  {
    version: 48,
    changes: [
      'Патч 48: Плавный размерный профиль спинных шипов',
      'Самые крупные шипы теперь находятся в середине спины; к хвосту и шее они плавно уменьшаются',
      'Устранено пересечение соседних шипов в зоне перехода хвоста в туловище во время бега'
    ]
  },
  {
    version: 47,
    changes: [
      'Патч 47: Исправлен градиент размера спинных шипов и линия хвоста',
      'Шипы плавно увеличиваются от кончика хвоста вдоль всей спины в направлении шеи',
      'Тёмно-зелёная линия ограничена видимой поверхностью хвоста и больше не проходит поверх корпуса'
    ]
  },
  {
    version: 46,
    changes: [
      'Патч 46: Единый цвет линии позвоночника и увеличенные шипы хвоста',
      'Линия вдоль хвоста теперь использует тот же тёмно-зелёный цвет, что и линия спины',
      'Шипы увеличены и выстроены по градиенту размера: маленькие у кончика, крупнее к основанию'
    ]
  },
  {
    version: 45,
    changes: [
      'Патч 45: Увеличены шипы и продолжена линия спины на хвост',
      'Шипы на хвосте стали крупнее, сохранили посадку на поверхности и постепенно уменьшаются к кончику',
      'Продлена тонкая линия спинного рисунка вдоль хвоста до его кончика'
    ]
  },
  {
    version: 44,
    changes: [
      'Патч 44: Исправлено положение шипов на хвосте',
      'Основания шипов перемещены непосредственно на верхнюю линию хвоста',
      'Размер шипов постепенно уменьшается к кончику; эффект парения устранён'
    ]
  },
  {
    version: 43,
    changes: [
      'Патч 43: Продолжение спинных шипов на хвост',
      'Небольшие спинные шипы продолжают линию позвоночника от корпуса почти до кончика хвоста',
      'Шипы постепенно уменьшаются к кончику; форма хвоста и корпуса сохранена'
    ]
  },
  {
    version: 42,
    changes: [
      'Патч 42: Финальная настройка положения хвоста',
      'Хвост приподнят ещё немного; утверждённый силуэт и сужение сохранены',
      'Расширен мягкий переход в области таза, верхний контур позвоночника плавнее переходит в хвост'
    ]
  },
  {
    version: 41,
    changes: [
      'Патч 41: Плавный переход хвоста в корпус',
      'Хвост слегка приподнят без изменения утверждённой формы и пропорций',
      'Скорректировано перекрытие в области таза и объединён контур перехода со спиной'
    ]
  },
  {
    version: 40,
    changes: [
      'Патч 40: Уточнён переход хвоста T-Rex в корпус',
      'Кончик хвоста сделан уже, толщина плавно нарастает к основанию без утолщения всей длины',
      'Скрыта внутренняя линия наложения хвоста и корпуса; внешний контур корпуса сохранён'
    ]
  },
  {
    version: 39,
    changes: [
      'Патч 39: Увеличен объём основания хвоста T-Rex',
      'Нижний контур основания хвоста немного расширен, верхняя линия сохранена и слегка согласована с позвоночником',
      'Сглажен внутренний стык между хвостом и задним контуром корпуса'
    ]
  },
  {
    version: 38,
    changes: [
      'Патч 38: Доработано соединение и силуэт хвоста T-Rex',
      'Существующая форма сохранена, хвост удлинён и плавно продолжает линию таза и позвоночника',
      'Контуры сделаны плавными, кончик закруглён; остальные части динозавра не менялись'
    ]
  },
  {
    version: 37,
    changes: [
      'Патч 37: Анатомическая форма хвоста T-Rex',
      'Усилено основание хвоста: оно плавно продолжает мощную мускулатуру таза',
      'Хвост получил более длинный и равномерный переход к узкому кончику, уточнены верхний и нижний контуры',
      'Добавлена мягкая плоскость объёма; голова, корпус, лапы, анимация и коллизии не менялись'
    ]
  },

  {
    version: 36,
    changes: [
      'Патч 36: Новая форма корпуса T-Rex',
      'Корпус стал более вытянутым и анатомичным: выраженная грудная клетка, наклонная спина и подтянутый живот',
      'Уточнены объём грудной клетки и переход к талии без изменения головы, хвоста и конечностей',
      'Сохранены четыре фазы бега, физика и коллизии'
    ]
  },

  {
    version: 35,
    changes: [
      'Патч 35: Анатомическая проработка T-Rex',
      'Уточнены пропорции корпуса: выраженная грудная клетка, плечевой пояс и переход к тазу',
      'Переработаны задние ноги, колени, голени и ступни с отдельными когтями',
      'Хвост и шея получили более плавные линии, добавлены сдержанные светотени и детали спины',
      'Голова сохранена; четыре фазы бега, физика и коллизии не менялись'
    ]
  },

  {
    version: 34,
    changes: [
      'Патч 34: Новая анатомия T-Rex',
      'Полностью переработано тело: глубокая грудь, более узкая талия и естественный переход к шее',
      'Добавлены объёмные бёдра, голени и ступни с чередованием четырёх фаз бега',
      'Хвост получил более длинный сужающийся силуэт и плавный изгиб',
      'Удачная голова сохранена; физика, коллизии, управление и интерфейс не менялись'
    ]
  },

  {
    version: 33,
    changes: [
      'Патч 33: Художественная доработка T-Rex',
      'Обновлён силуэт персонажа: более плавный контур, выраженная грудь, голова и сужающийся хвост',
      'Добавлены отдельные пиксельные светотени, детали морды и челюсти',
      'Сохранены четыре фазы бега, игровые коллизии и управление'
    ]
  },
  {
    version: 32,
    changes: [
      'Патч 32: Единая анимация T-Rex и исправленная история версий',
      'Главное меню использует те же четыре фазы бега, что и игровой режим',
      'Исправлена отметка «ТЕКУЩАЯ» в истории обновлений',
      'Добавлены пропущенные записи патчей 30 и 31',
      'Уточнены детали пиксельного силуэта T-Rex без изменения игровой физики'
    ]
  },
  {
    version: 31,
    changes: [
      'Патч 31: Стилизованный T-Rex и компактная пауза',
      'Улучшен силуэт динозавра и детали головы',
      'Кнопка паузы уменьшена до 38×38 px и опущена ближе к нижнему краю'
    ]
  },
  {
    version: 30,
    changes: [
      'Патч 30: Перерисовка T-Rex и удобная пауза',
      'Обновлён пиксельный силуэт динозавра и четыре фазы бега',
      'Кнопка паузы перенесена в нижнюю левую часть экрана'
    ]
  },
  {
    version: 29,
    changes: [
      'Патч 29: Пауза и обновлённый пиксельный T-Rex',
      'Добавлена кнопка паузы во время забега',
      'Пауза останавливает игровой мир, счёт, препятствия и таймеры бонусов',
      'Добавлены кнопки «Возобновить» и «В меню» в пиксельном стиле',
      'Переработан силуэт динозавра: крупная голова, челюсть, короткие лапы и мощные ноги',
      'Беговая анимация расширена до четырёх фаз с движением ног и корпуса',
      'Сохранена поддержка цветовых скинов и текущей игровой физики'
    ]
  },
  {
    version: 28,
    changes: [
      'Патч 28: Компактное меню у правого края экрана',
      'Кнопки меню собраны в полупрозрачную панель с размытием фона',
      'Центральная и левая часть экрана освобождены для игровой сцены',
      'Размеры панели и кнопок адаптируются под небольшие и низкие экраны'
    ]
  },
  {
    version: 27,
    changes: [
      'Патч 26: Стабильность и безопасность',
      'Исправлена XSS-уязвимость в мировом рейтинге',
      'Исправлен дробный highScore (новый рекорд теперь корректен)',
      'Фон меню больше не залипает в позднем биоме после игры',
      'Бейдж ежедневки обновляется сразу после игры',
      'Настройки звука и музыки сохраняются между сессиями',
      'Корректный сброс игрового состояния при «Сбросить прогресс»',
      'Устранена утечка слушателей Firebase-онлайна',
      'Нормализация старых сейвов при загрузке'
    ]
  },
  {
    version: 26,
    changes: [
      'Патч 25: Мировой рейтинг и Онлайн!',
      'Добавлено подключение к Firebase',
      'Теперь рейтинг общий для всех игроков (Топ-50)',
      'В главном меню показывается реальное количество игроков онлайн',
      'Ваш рекорд автоматически отправляется в облако при смерти',
      'В рейтинге подсвечивается ваша строчка'
    ]
  },
  {
    version: 25,
    changes: ['Патч 24: Питомцы-компаньоны']
  },
  {
    version: 24,
    changes: ['Патч 23: Редкие события (Метеорит и Золотая птица)']
  },
  {
    version: 23,
    changes: ['Патч 22.1: Исправление цветов, бонусы внизу, динамическая сложность']
  },
  {
    version: 22,
    changes: ['Патч 22: Биомы! (Пустыня, Лес, Снег, Вулкан)']
  }
];

const GRAVITY = 0.75;
const JUMP_FORCE = -12.6;
const DINO_SCALE_GAME = 1.8;
const DINO_SCALE_MENU = 3.0;
const BIRD_SCALE_GAME = 0.9;
const BIRD_SCALE_MENU = 1.2;
const BASE_SPEED = 3.5;
const MAX_SPEED_BONUS = 4.5;
const DAY_NIGHT_CYCLE = 75;
const CLEAR_DURATION = 20;
const RAIN_DURATION = 15;
const COMBO_TIMEOUT = 5;

const MUSIC_MELODY = [523.25, 587.33, 659.25, 587.33, 523.25, 659.25, 783.99, 659.25, 698.46, 659.25, 587.33, 523.25, 587.33, 523.25, 392.00, 0];
const MUSIC_BASS = [130.81, 0, 146.83, 0, 164.81, 0, 130.81, 0, 174.61, 0, 146.83, 0, 130.81, 0, 196.00, 0];
const MUSIC_VOLUME = 0.14;

const SKINS = [
  { id: 'default', name: 'Зелёный', cost: 0, body: '#4CAF50', outline: '#1B5E20', belly: '#A5D6A7', claw: '#FFF', eye: '#FFF', bonus: { type: 'none', value: 0, desc: 'Без бонуса' } },
  { id: 'fire', name: 'Огненный', cost: 50, body: '#F44336', outline: '#B71C1C', belly: '#FFCDD2', claw: '#FFE082', eye: '#FFF', bonus: { type: 'score', value: 1.10, desc: '+10% к очкам' } },
  { id: 'ice', name: 'Ледяной', cost: 100, body: '#2196F3', outline: '#0D47A1', belly: '#BBDEFB', claw: '#E1F5FE', eye: '#FFF', bonus: { type: 'powerup', value: 2, desc: '+2 сек к бонусам' } },
  { id: 'gold', name: 'Золотой', cost: 200, body: '#FFC107', outline: '#FF6F00', belly: '#FFECB3', claw: '#FFF', eye: '#FFF', bonus: { type: 'bones', value: 1, desc: '+1 кость за птицу' } }
];

const PETS = [
  { id: 'none', name: 'Нет', cost: 0, icon: '❌', desc: 'Без питомца', bonus: { type: 'none', desc: '' } },
  { id: 'ptero', name: 'Летун', cost: 100, icon: '🦇', desc: 'Летает рядом', bonus: { type: 'none', desc: 'Красота' } },
  { id: 'ghost', name: 'Призрак', cost: 200, icon: '👻', desc: 'Спасает от 1 кактуса', bonus: { type: 'shield_once', desc: '1 спасение' } },
  { id: 'flame', name: 'Огонёк', cost: 300, icon: '🔥', desc: '+5% к очкам', bonus: { type: 'score', value: 1.05, desc: '+5% очков' } }
];

const UPGRADES = [
  { id: 'jump', icon: '🦘', name: 'Прыжок', desc: 'Сила прыжка', maxLevel: 5, costs: [10, 30, 60, 100, 150] },
  { id: 'magnet', icon: '🧲', name: 'Магнит', desc: 'Притяжение птиц', maxLevel: 2, costs: [15, 40] },
  { id: 'doubleBones', icon: '✨', name: 'Двойные кости', desc: '+1 кость за птицу', maxLevel: 2, costs: [25, 75] }
];

const ACHIEVEMENTS_DEF = [
  { id: 'first_run', icon: '👟', name: 'Первый шаг', desc: 'Сыграть первую игру' },
  { id: 'score_500', icon: '⭐', name: 'Новичок', desc: 'Набрать 500 очков' },
  { id: 'score_2000', icon: '🌟', name: 'Профи', desc: 'Набрать 2000 очков' },
  { id: 'birds_10', icon: '🦅', name: 'Охотник', desc: 'Съесть 10 птиц за игру' },
  { id: 'bones_100', icon: '💰', name: 'Богач', desc: 'Накопить 100 костей' }
];

const TIME_KEYS = [
  { t: 0.00, top: '#0A0E1A', bot: '#1A1F35' }, { t: 0.10, top: '#0F1432', bot: '#252A4A' },
  { t: 0.16, top: '#2E1A47', bot: '#6B3B7C' }, { t: 0.22, top: '#E8A598', bot: '#FFD89B' },
  { t: 0.28, top: '#FFB88C', bot: '#FFE8B0' }, { t: 0.38, top: '#87CEEB', bot: '#E3F2FD' },
  { t: 0.50, top: '#4AA3DF', bot: '#B3E5FC' }, { t: 0.65, top: '#FFC947', bot: '#FFE082' },
  { t: 0.72, top: '#FF8A65', bot: '#FFAB91' }, { t: 0.78, top: '#FF6B6B', bot: '#FFA451' },
  { t: 0.84, top: '#8B2E5F', bot: '#E85D75' }, { t: 0.92, top: '#3D1E5C', bot: '#6B3B8C' },
  { t: 0.97, top: '#0A0E1A', bot: '#1A1F35' }, { t: 1.00, top: '#0A0E1A', bot: '#1A1F35' }
];

const BIOMES = [
  { id: 'desert', name: '🌵 Пустыня', minScore: 0, ground: '#8BC34A', groundLine: '#33691E', dirt: '#795548', mountainFar: '#90CAF9', mountainNear: '#A5D6A7', cactus: '#388E3C', cactusLight: '#4CAF50', bird: '#37474F', cloud: '#FFFFFF', hasSnow: false },
  { id: 'forest', name: '🌲 Лес', minScore: 1000, ground: '#4CAF50', groundLine: '#1B5E20', dirt: '#5D4037', mountainFar: '#2E7D32', mountainNear: '#1B5E20', cactus: '#2E7D32', cactusLight: '#4CAF50', bird: '#263238', cloud: '#E8F5E9', hasSnow: false },
  { id: 'snow', name: '❄️ Снег', minScore: 2500, ground: '#FFFFFF', groundLine: '#B0BEC5', dirt: '#CFD8DC', mountainFar: '#E3F2FD', mountainNear: '#BBDEFB', cactus: '#90CAF9', cactusLight: '#E3F2FD', bird: '#ECEFF1', cloud: '#FAFAFA', hasSnow: true },
  { id: 'volcano', name: '🌋 Вулкан', minScore: 5000, ground: '#3E2723', groundLine: '#1B0000', dirt: '#212121', mountainFar: '#BF360C', mountainNear: '#FF5722', cactus: '#BF360C', cactusLight: '#FF7043', bird: '#000000', cloud: '#4E342E', hasSnow: false }
];

function getBiomeState(currentScore) {
  let currentIdx = 0;
  for (let i = 0; i < BIOMES.length; i++) {
    if (currentScore >= BIOMES[i].minScore) currentIdx = i;
  }
  const current = BIOMES[currentIdx];
  const next = BIOMES[currentIdx + 1] || null;
  let transitionT = 0;
  if (next) {
    const transitionStart = next.minScore - 100;
    if (currentScore >= transitionStart) transitionT = (currentScore - transitionStart) / 100;
  }
  return { current, next, transitionT };
}

function mixBiomeColor(color1, color2, t) { return lerpColor(color1, color2, Math.max(0, Math.min(1, t))); }

const DAILY_TYPES = [
  { type: 'score', icon: '⭐', title: 'Набери очки за одну игру', targets: [300, 400, 500, 600] },
  { type: 'birds', icon: '🦅', title: 'Съешь птиц за день', targets: [5, 8, 10, 15] },
  { type: 'bones', icon: '🦴', title: 'Собери кости за день', targets: [15, 25, 40, 60] }
];

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function generateDailyQuest(todayStr) {
  const randomType = DAILY_TYPES[Math.floor(Math.random() * DAILY_TYPES.length)];
  const target = randomType.targets[Math.floor(Math.random() * randomType.targets.length)];
  return { date: todayStr, type: randomType.type, icon: randomType.icon, title: `${randomType.title} (цель: ${target})`, target, progress: 0, completed: false, claimed: false };
}

function checkDailyAndStreak() {
  const today = getTodayString();
  let changed = false;
  if (save.lastPlayDate !== today) {
    if (save.lastPlayDate) {
      const last = new Date(save.lastPlayDate);
      const now = new Date(today);
      const lastTime = last.getTime();
      const nowTime = now.getTime();
      // ПАТЧ 26: Защита от битых дат в сейве — раньше NaN ломал стрик молча
      if (!isNaN(lastTime) && !isNaN(nowTime)) {
        const diffDays = Math.ceil(Math.abs(nowTime - lastTime) / (1000 * 60 * 60 * 24));
        save.streak = (diffDays === 1) ? (save.streak || 0) + 1 : 1;
      } else {
        save.streak = 1;
      }
    } else { save.streak = 1; }
    save.lastPlayDate = today;
    changed = true;
  }
  if (!save.dailyQuest || save.dailyQuest.date !== today) {
    save.dailyQuest = generateDailyQuest(today);
    changed = true;
  }
  if (changed) writeSave();
}

function xpForLevel(level) { return 100 + (level - 1) * 50; }
function xpLevelReward(level) { return 10 + level * 5; }
function getLevelFromXp(totalXp) {
  let level = 1, remaining = Math.max(0, totalXp);
  while (remaining >= xpForLevel(level) && level < 999) { remaining -= xpForLevel(level); level++; }
  return { level, currentXp: remaining, xpToNext: xpForLevel(level) };
}

function getCurrentSkin() { return SKINS.find(s => s.id === save.currentSkin) || SKINS[0]; }
function getCurrentPet() { return PETS.find(p => p.id === save.currentPet) || PETS[0]; }

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let W = window.innerWidth;
let H = window.innerHeight;
let GROUND_Y = H * 0.8;

let score = 0, speed = BASE_SPEED, frame = 0, lastTime = 0, spawnTimer = 0, shakeTime = 0, sessionBones = 0;
let dayNightTime = 0.5 * DAY_NIGHT_CYCLE, weatherTime = 0, isRaining = false, lightning = null, lightningAmbient = 0;
let birdsEatenThisGame = 0, comboCount = 0, comboTimer = 0;
let lastPowerUpSecond = -1;
let meteorTimer = 15;
let ghostUsed = false;
let petX = 0, petY = 0;

const dino = { x: 60, y: GROUND_Y, scale: DINO_SCALE_GAME, vy: 0, jumping: false, ducking: false, jumpsLeft: 1 };
let obstacles = [], birds = [], particles = [], bonesFlying = [], powerUps = [], rainDrops = [], snowflakes = [], activePowerUps = [], meteors = [];
let activeTab = 'upg';

let stars = [];
for (let i = 0; i < 80; i++) stars.push({ x: Math.random(), y: Math.random() * 0.65, size: Math.random() * 1.5 + 0.5, phase: Math.random() * Math.PI * 2, brightness: Math.random() * 0.5 + 0.5 });
let clouds = [{ x: 500, y: 60, s: 1, speed: 0.2 }, { x: 750, y: 90, s: 0.8, speed: 0.3 }];
let groundDots = [];
for (let i = 0; i < 50; i++) groundDots.push({ x: Math.random() * W, y: GROUND_Y + 6 + Math.random() * 20, r: Math.random() * 1.5 + 0.5 });

const pauseBtn = document.getElementById('pauseBtn');
const pauseScreen = document.getElementById('pauseScreen');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const fsIconExpand = document.getElementById('fsIconExpand');
const fsIconCollapse = document.getElementById('fsIconCollapse');
const hud = document.getElementById('hud');
const hudHigh = document.getElementById('hudHigh');
const hudScore = document.getElementById('hudScore');
const hudBones = document.getElementById('hudBones');
const tapHint = document.getElementById('tapHint');
const speedBarContainer = document.getElementById('speedBarContainer');
const speedBar = document.getElementById('speedBar');
const powerUpHud = document.getElementById('powerUpHudContainer');
const versionBtn = document.getElementById('versionBtn');
const versionNumber = document.getElementById('versionNumber');
const changelogDialog = document.getElementById('changelogDialog');
const changelogContent = document.getElementById('changelogContent');
const comboHud = document.getElementById('comboHud');
const comboMult = document.getElementById('comboMult');
const comboTimerFill = document.getElementById('comboTimerFill');
const menuScreen = document.getElementById('menuScreen');
const dailyScreen = document.getElementById('dailyScreen');
const recordsScreen = document.getElementById('recordsScreen');
const upgradesScreen = document.getElementById('upgradesScreen');
const achievementsScreen = document.getElementById('achievementsScreen');
const settingsScreen = document.getElementById('settingsScreen');
const gameoverScreen = document.getElementById('gameoverScreen');
const confirmDialog = document.getElementById('confirmDialog');
const recordsList = document.getElementById('recordsList');
const upgradesList = document.getElementById('upgradesList');
const skinsList = document.getElementById('skinsList');
const achievementsList = document.getElementById('achievementsList');
const upgradesBones = document.getElementById('upgradesBones');
const goScore = document.getElementById('goScore');
const goHigh = document.getElementById('goHigh');
const goBones = document.getElementById('goBones');
const newRecordText = document.getElementById('newRecordText');
const btnSound = document.getElementById('btnSound');
const btnMusic = document.getElementById('btnMusic');
const achievementPopup = document.getElementById('achievementPopup');
const achPopupIcon = document.getElementById('achPopupIcon');
const achPopupName = document.getElementById('achPopupName');
const tabUpg = document.getElementById('tabUpg');
const tabSkins = document.getElementById('tabSkins');
const tabPets = document.getElementById('tabPets');
const petsList = document.getElementById('petsList');
const xpBarContainer = document.getElementById('xpBarContainer');
const xpLevel = document.getElementById('xpLevel');
const xpBarFill = document.getElementById('xpBarFill');
const levelUpPopup = document.getElementById('levelUpPopup');
const levelUpName = document.getElementById('levelUpName');
const levelUpReward = document.getElementById('levelUpReward');
const goXp = document.getElementById('goXp');
const dailyStreak = document.getElementById('dailyStreak');
const dailyIcon = document.getElementById('dailyIcon');
const dailyTitle = document.getElementById('dailyTitle');
const dailyProgressText = document.getElementById('dailyProgressText');
const dailyTargetText = document.getElementById('dailyTargetText');
const dailyProgressFill = document.getElementById('dailyProgressFill');
const dailyBoneReward = document.getElementById('dailyBoneReward');
const dailyXpReward = document.getElementById('dailyXpReward');
const btnClaimDaily = document.getElementById('btnClaimDaily');
const dailyBadge = document.getElementById('dailyBadge');

function lerpColor(a, b, t) {
  function parse(c) {
    if (!c || typeof c !== 'string') return [0, 0, 0];
    if (c.startsWith('#')) {
      const v = parseInt(c.slice(1), 16);
      return [(v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
    } else {
      const m = c.match(/\d+/g);
      return m ? [+m[0], +m[1], +m[2]] : [0, 0, 0];
    }
  }
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
        }
