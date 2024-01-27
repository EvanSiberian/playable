import Phaser from "phaser";

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Main' });
        this.isDrawing = false;
        this.lines = [];
        this.parkedCars = {};
        this.parkedCarsCount = 0;
        this.currentPath = [];
    }
    create() {
        const carPositions = [
            { x: 320, y: 125, texture: 'carBlue' },
            { x: 420, y: 450, texture: 'carRed' },
            { x: 620, y: 125, texture: 'carGreen' },
            { x: 520, y: 450, texture: 'carYellow' }
        ];


        this.backgroundGraphics = this.add.graphics();
        this.backgroundGraphics.fillStyle(0x545454, 1); // Установка цвета и прозрачности для заливки
        this.backgroundGraphics.fillRect(0, 0, this.sys.game.config.width, this.sys.game.config.height); // Рисование прямоугольника на весь экран


        this.yellowParkingZone = new Phaser.Geom.Rectangle(390, 80, 100, 100); // Желтая парковка 
        this.redParkingZone = new Phaser.Geom.Rectangle(490, 80, 100, 100); // Красная праковка 

        this.graphics = this.add.graphics({ lineStyle: { width: 4, color: this.drawColor } });


        this.drawParkingLines();
        this.drawParkingLetters();
        this.drawCars(carPositions);
        this.createHandHint(carPositions)

        this.input.on('pointerdown', this.onPointerDown, this);
        this.input.on('pointermove', this.onPointerMove, this);
        this.input.on('pointerup', this.onPointerUp, this);

        //this.music = this.sound.add('sound_fx').play();

    }
    drawParkingLines() {
        const graphics = this.add.graphics({ lineStyle: { width: 5, color: 0xffffff } });

        const lineLength = 200; // Длина линии
        const startY = 0; // Начальная Y координата
        const endY = startY + lineLength; // Конечная Y координата
        const startX = 270; // Начальная X координата первой линии

        // Рисуем линии
        for (let i = 0; i < 5; i++) {
            const currentX = startX + 100 * i; // X координата текущей линии
            graphics.moveTo(currentX, startY).lineTo(currentX, endY).stroke();
        }
    }

    drawParkingLetters() {
        const letters = ['P', 'P']; // Массив с буквами
        const colors = ['#ffc841', '#d1191f']; // Цвета для букв
        const startX = 405; // Начальная X координата для первой буквы
        const Y = 100; // Y координата для букв

        // Создаем буквы
        for (let i = 0; i < letters.length; i++) {
            const letter = letters[i];
            const color = colors[i];
            const x = startX + 105 * i; // X координата для текущей буквы
            this.add.text(x, Y, letter, { font: '48px Arial', fill: color });
        }
    }
    drawCars(carPositions) {
        carPositions.forEach((car) => {
            let sprite = this.add.sprite(car.x, car.y, car.texture);
            sprite.setScale(0.5);

            // Делаем интерактивными только красную и желтую машины
            if (car.texture === 'carRed' || car.texture === 'carYellow') {
                sprite.setInteractive();
                sprite.on('pointerdown', () => {
                    this.selectedCar = car.texture; // Сохраняем выбранную машину
                    this.currentCarSprite = sprite; // Сохраняем спрайт текущей машины для дальнейшего использования
                });
                if (car.texture === 'carRed') {
                    this.parkedCars['carRed'] = { sprite: this.currentCarSprite, path: [], isParked: false };
                } else if (car.texture === 'carYellow') {
                    this.parkedCars['carYellow'] = { sprite: this.currentCarSprite, path: [], isParked: false };
                }
            }
        });
    }

    createHandHint(carPositions) {
        // Добавление спрайта руки-подсказки
        const redCarPosition = carPositions.find(car => car.texture === 'carRed');
        const redParkingSpot = { x: 505, y: 100 };

        this.handHint = this.add.sprite(redCarPosition.x, redCarPosition.y, 'hand');
        this.handHint.setScale(0.5);
        this.handHint.setOrigin(0, 0);

        // Анимация движения руки от машины к парковке
        this.tweens.add({
            targets: this.handHint,
            x: redParkingSpot.x,
            y: redParkingSpot.y,
            ease: 'Cubic.easeInOut',
            duration: 1500,
            yoyo: true, // анимация в обратном направлении
            repeat: -1 // бесконечное повторение
        });
    }

    hideHandHint() {
        this.tweens.add({
            targets: this.handHint,
            alpha: { from: 1, to: 0 },
            duration: 500,
            onComplete: () => {
                this.handHint.setVisible(false);
            }
        });
    }

    onPointerDown(pointer, gameObject) {
        if (gameObject.length === 0) {
            // Если клик был не по объекту, выходим из функции
            return;
        }

        const carSprite = gameObject[0];
        // Проверяем, является ли спрайт машины интерактивным
        if (this.parkedCars[gameObject[0].texture.key] && this.parkedCars[gameObject[0].texture.key].isParked) {
            // Если машина припаркована, прекращаем выполнение
            return;
        }
        if (gameObject.length > 0 && (gameObject[0].texture.key === 'carRed' || gameObject[0].texture.key === 'carYellow')) {
            this.hideHandHint();
            this.isDrawing = true;
            // Создаем новый объект Graphics для каждой линии
            const graphics = this.add.graphics({ lineStyle: { width: 4, color: gameObject[0].texture.key === 'carRed' ? 0xff0000 : 0xffff00 } });
            graphics.moveTo(pointer.x, pointer.y);
            this.lines.push(graphics); // Сохраняем объект Graphics в массиве
        }
    }

    onPointerMove(pointer) {
        if (this.isDrawing && this.lines.length > 0) {
            const graphics = this.lines[this.lines.length - 1]; // Получаем текущий объект Graphics
            graphics.lineTo(pointer.x, pointer.y);
            graphics.strokePath();
            graphics.moveTo(pointer.x, pointer.y);
            this.currentPath.push({ x: pointer.x, y: pointer.y });
        }
    }

    checkAllCarsParked() {
        const expectedParkedCars = 2; // Количество машин, которые должны быть припаркованы
        if (this.parkedCarsCount === expectedParkedCars) {
            // Все машины припаркованы, начинаем анимацию движения
            Object.keys(this.parkedCars).forEach(carKey => {
                this.animateCarMovement(carKey);
            });
        }
    }

    onPointerUp(pointer) {
        if (!this.isDrawing) {
            return; // Если рисование не начиналось, просто выходим из функции
        }
        this.isDrawing = false;
        const lastGraphics = this.lines[this.lines.length - 1]; // Получаем последний объект Graphics
        if (lastGraphics) {
            // Проверяем, соответствует ли конец линии зоне парковки
            let parkingZone;
            if (this.selectedCar === 'carRed') {
                parkingZone = this.redParkingZone;
            } else if (this.selectedCar === 'carYellow') {
                parkingZone = this.yellowParkingZone;
            }

            if (parkingZone && Phaser.Geom.Rectangle.Contains(parkingZone, pointer.x, pointer.y)) {
                // Траектория заканчивается на правильном парковочном месте
                if (this.selectedCar === 'carRed') {
                    this.parkedCars['carRed'] = { sprite: this.currentCarSprite, path: this.currentPath, isParked: true };
                    this.currentPath = [];
                } else if (this.selectedCar === 'carYellow') {
                    this.parkedCars['carYellow'] = { sprite: this.currentCarSprite, path: this.currentPath, isParked: true };
                    this.currentPath = [];
                }
                this.parkedCarsCount++;
                this.checkAllCarsParked()
            } else {
                // Если траектория не заканчивается на правильном парковочном месте
                lastGraphics.clear(); // Удаляем неправильную траекторию
                this.lines.pop(); // Удаляем последний элемент из массива
            }
        }
    }
    checkCollision(sprite1, sprite2) {
        const distance = Phaser.Math.Distance.Between(sprite1.x, sprite1.y, sprite2.x, sprite2.y);
        return distance < 30; // Значение расстояние с которого детектить столкновение
    }
    showLogoAndPlayButton() {
        // Лого пока заглушка
        const logo = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY - 50, 'logo'); // Убедитесь, что у вас загружен логотип с ключом 'logo'

        // Кнопка "Play Now"
        const playNowButton = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY + 100, 'CTA')
            .setOrigin(0.5)
            .setScale(0.5)
            .setInteractive()
            .on('pointerdown', () => {
                // Действие при нажатии на кнопку, например, перезапуск игры
                // Сюда линк на CTA кнопочку добавим 
            });

        // Добавление эффектов, если необходимо, например, анимация появления
        this.tweens.add({
            targets: [logo, playNowButton],
            alpha: { from: 0, to: 1 },
            duration: 1000
        });
    }
    createDarkBackground() {
        // Создаем спрайт для фона с начальной прозрачностью 0
        const darkBackground = this.add.sprite(0, 0, 'back').setOrigin(0, 0).setAlpha(0);

        // Анимируем прозрачность фона от 0 до 0.5 для создания эффекта затемнения
        this.tweens.add({
            targets: darkBackground,
            alpha: 0.5,
            duration: 1000,
            ease: 'Power2',
        });
    }
    showFailImage() {
        const failImage = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'fail');
        failImage.setAlpha(0); // начальная прозрачность
        // Анимация появления и "пульсации" изображения "Fail"
        this.tweens.add({
            targets: failImage,
            scale: { from: 0.25, to: 0.75 }, // Увеличиваем и уменьшаем размер
            alpha: 1, // конечная прозрачность
            duration: 1000,
            ease: 'Power2',
            yoyo: true,
            repeat: 1, // Установите 1 повторение для "пульсации"
            hold: 100,
            onComplete: () => {
                // Плавное исчезновение изображения "Fail"
                this.tweens.add({
                    targets: failImage,
                    alpha: 0,
                    duration: 1000,
                    ease: 'Power2',
                    onComplete: () => {
                        // Вложеность пофиксим потом, надеюсь
                        failImage.destroy(); // Уничтожаем изображение после анимации
                        // CTA + Фон
                        this.createDarkBackground();
                        this.showLogoAndPlayButton();
                    }
                });
            }
        });
    }
    animateCarMovement(carKey) {
        const carInfo = this.parkedCars[carKey];
        if (!carInfo || !carInfo.isParked || !carInfo.path || carInfo.path.length === 0) {
            return;
        }

        // Анимация движения машины по сохранённому пути
        let tweenPath = { t: 0, vec: new Phaser.Math.Vector2() };
        let path = new Phaser.Curves.Path(carInfo.path[0].x, carInfo.path[0].y);
        carInfo.path.forEach((point, index) => {
            if (index > 0) path.lineTo(point.x, point.y);
        });

        carInfo.tween = this.tweens.add({
            targets: tweenPath,
            t: 1,
            ease: 'Linear',
            duration: 2000,
            onUpdate: () => {
                path.getPoint(tweenPath.t, tweenPath.vec);
                carInfo.sprite.setPosition(tweenPath.vec.x, tweenPath.vec.y);

                Object.keys(this.parkedCars).forEach(key => {
                    const car = this.parkedCars[key];
                    if (car.isParked) {
                        Object.keys(this.parkedCars).forEach(otherKey => {
                            if (otherKey !== key) {
                                const otherCar = this.parkedCars[otherKey];
                                if (otherCar.isParked && this.checkCollision(car.sprite, otherCar.sprite)) {
                                    car.tween.stop();
                                    otherCar.tween.stop();
                                    this.showFailImage();
                                }
                            }
                        });
                    }
                });
            },
            onComplete: () => {
                this.showFailImage(); // Пока требований к успеху нет, если что заменим после согласования, хз если честно почему всегда фейл должен быть
            }
        });
    }
}