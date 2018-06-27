/**
 *  jQuery плагин для показа изображений
 *
 *  @author Melnikov R.S.
 *  @version 1.0.7
 */

(function ($) {

    $.fn.mrs2000box = function (options, params) {

        var $spinner = null;
        var $shadow = null;
        var $image = null;
        var $frame = null;
        var $left = null;
        var $right = null;
        var $close = null;
        var $title = null;
        var $error = null;

        var list = [],
            current = 0,
            buffer = null,
            directional = 1;

        var imageWidth, imageHeight, showTitle;
        var isReady = false, isShow = false;

        var bufferWait = true, bufferCurrent;

        if ($.isPlainObject(options)) {
            options = $.extend({
                showTitle: true,
                showNumber: true,
                showGallery: false,
                advanced: false, // depricated
                onBeforeLoad: null,
                onLoad: null,
                onResize: null,
                onClose: null,
                eventSelector: 'a, img'
            }, options);

            if (options.advanced) { // depricated
                options.showGallery = true;
                options.showTitle = true;
                options.showNumber = true;
            }
        } else {
            //Методы
            var $wrapper = getWrapper(this);
            if ($wrapper) {
                //Показать фото
                if (options === 'show') {
                    var index = typeof params === 'undefined' ? 0 : params;
                    var $a;
                    if ($wrapper.data('m2b-wrapper')) {
                        $a = $wrapper.find('a').eq(index);
                    } else {
                        $a = $wrapper.eq(index);
                    }
                    options = $wrapper.data('m2b-options');
                    //current = index;
                    show($wrapper, $a[0]);
                }
            }
            return;
        }

        /**
         * Создание фрейма
         */
        function create() {

            $shadow = $('.m2b-shadow');
            if ($shadow.length == 0) {
                $shadow = $('<div class="m2b-shadow"></div>');
                $shadow.appendTo('body').click(close);

                $frame = $('<div class="m2b-frame"><div class="m2b-shadow2"></div>' +
                    '<div class="m2b-spinner"><div class="m2b-double-bounce1"></div><div class="m2b-double-bounce2"></div></div>' +
                    '<img class="m2b-image"><div class="m2b-error"></div><div class="m2b-left"></div><div class="m2b-right"></div>' +
                    '<div class="m2b-btn-close"></div><div class="m2b-title"></div></div>');
                $frame.appendTo('body');
            } else {
                $frame = $('.m2b-frame');
                $frame.show();
                $shadow.show();
            }

            $spinner = $frame.find('.m2b-spinner');

            $image = $frame.find('.m2b-image');
            $image.hide().on('load', onImageLoad).click(onImageClick);
            $frame.click(onImageClick);

            $left = $frame.find('.m2b-left');
            $right = $frame.find('.m2b-right');
            $left.click(loadPrev);
            $right.click(loadNext);

            $title = $frame.find('.m2b-title');
            if (options.showTitle || options.showNumber) {
                $title.show();
            }

            $error = $frame.find('.m2b-error');
            $error.hide();

            $close = $frame.find('.m2b-btn-close');
            $close.click(close);

            buffer = new Image;
            buffer.onload = function () {
                if (bufferWait) {
                    imageWidth = buffer.naturalWidth;
                    imageHeight = buffer.naturalHeight;
                    $image.attr('src', buffer.src).show();
                    isReady = true;
                    preload();
                } else {
                    bufferWait = true;
                }
            };
            buffer.onerror = function () {
                if (bufferWait) {
                    $error.show();
                    $image.hide();
                    $spinner.hide();
                    isReady = true;
                    preload();
                }
            };

            $(window).bind('resize', onResize);
            $(document).bind('keyup', onKeyup);
        }

        /**
         * Ресайз окна
         */
        function onResize() {
            if (isShow) {
                setImageSize();
                if (options.onResize) {
                    var e = {
                        width: imageWidth,
                        height: imageHeight,
                        object: list[current].object,
                        img: $image
                    };
                    options.onResize(e);
                }
            }
        }

        /**
         * События клавиатуры
         * @param e
         */
        function onKeyup(e) {
            if (isShow) {
                switch (e.which) {
                    case 27:
                        close();
                        break;
                    case 37:
                        loadPrev();
                        break;
                    case 39:
                        loadNext();
                        break;
                }
            }
        }

        /**
         * Установить размеры загруженного фото
         */
        function setImageSize() {
            var fw = $frame.width(),
                fh = $frame.height(),
                s = imageWidth / imageHeight,
                width, height;

            if (showTitle) {
                //noinspection JSValidateTypes
                fh -= $title.outerHeight();
            }

            if (s > fw / fh) {
                width = imageWidth > fw ? fw : imageWidth;
                height = width / s;
            } else {
                height = imageHeight > fh ? fh : imageHeight;
                width = height * s;
            }

            var left = fw * 0.5 - width * 0.5,
                top = fh * 0.5 - height * 0.5;

            $image.css({top: top, left: left, width: width, height: height});
        }

        /**
         * Событие загрузки изображения
         */
        function onImageLoad() {
            if ($title.html() != '') {
                showTitle = true;
                $title.show();
            }
            if (options.onLoad) {
                var e = {
                    width: imageWidth,
                    height: imageHeight,
                    object: list[current].object,
                    img: this
                };
                options.onLoad(e);
            }
            setImageSize();
            $spinner.hide();
        }

        /**
         * Клик по изображению или фрейму
         */
        function onImageClick() {
            if (list.length < 2 || !options.showGallery) {
                close();
            }
        }

        /**
         * Загрузка текущего изображения
         */
        function load() {
            if (options.onBeforeLoad) {
                options.onBeforeLoad({img: $image});
            }
            if (options.showTitle || options.showNumber) {
                $title.html(list[current].title).hide();
            }

            $image.hide();
            $spinner.show();
            $error.hide();
            isReady = false;
            bufferWait = true;
            bufferCurrent = current;
            buffer.src = list[current].href;
        }

        /**
         * Предварительная загрузка следующего или предыдущего фото
         */
        function preload() {
            if (list.length > 1) {
                bufferWait = false;
                bufferCurrent = directional == 1 ? getNextId() : getPrevId();
                buffer.src = list[bufferCurrent].href;
            }
        }

        /**
         * ID предыдущего фото
         * @returns {number}
         */
        function getPrevId() {
            var n = current - 1;
            if (n == -1) n = list.length - 1;
            return n;
        }

        /**
         * ID следующего фото
         * @returns {number}
         */
        function getNextId() {
            var n = current + 1;
            if (n == list.length) n = 0;
            return n;
        }

        /**
         * Загрузить предыдущее фото
         */
        function loadPrev() {
            if (list.length > 1 && options.showGallery) {
                directional = 0;
                current = getPrevId();
                load();
            }
        }

        /**
         * Загрузить следующее фото
         */
        function loadNext() {
            if (list.length > 1 && options.showGallery) {
                directional = 1;
                current = getNextId();
                load();
            }
        }

        /**
         * Подпись
         * @param element
         * @returns {string}
         */
        function getTitle(element) {
            var title = '';
            if (options.showNumber && element.rel) {
                title += '<b>Фото №' + element.rel + '</b> ';
            }

            return title + element.title;
        }

        function getWrapper(element) {
            var $wrapper;
            if (element.tagName == 'A') {
                $wrapper = $(element).parent();
                if ($wrapper.data('m2b')) {
                    return;
                }
                $wrapper.data('m2b-wrapper', true);
            } else {
                $wrapper = $(element);
            }

            $wrapper.data('m2b', true);
            return $wrapper;
        }

        function show($wrapper, item) {
            create();
            list = [];
            if (options.showGallery) {

                var $items = $wrapper.find('a'), attr = 'href';
                if ($items.length == 0) {
                    attr = 'src';
                    $items = $wrapper.find('img');
                }

                $items.each(function (index, element) {
                    if (element == item) current = index;
                    list.push({
                        object: element,
                        href: element[attr],
                        title: getTitle(element)
                    });
                });
            } else {
                list.push({
                    object: item,
                    href: item.href,
                    title: getTitle(item)
                });
            }

            if (list.length > 1 && options.showGallery) {
                $left.show();
                $right.show();
            } else {
                $left.hide();
                $right.hide();
            }

            load();
            isShow = true;
        }

        /**
         * Инициализация плагина
         */
        function init() {
            var $wrapper = getWrapper(this);
            if ($wrapper) {
                $wrapper.data('m2b-options', options);
                $wrapper.on('click', options.eventSelector, function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    show($wrapper, this);
                });
            }
        }

        /**
         * Закрыть просмотр
         */
        function close() {
            $shadow.hide();
            $frame.hide();
            $left.unbind('click');
            $right.unbind('click');
            $close.unbind('click');
            $image.unbind('load');
            $image.unbind('click');
            $frame.unbind('click');
            $(window).unbind('resize', onResize);
            $(document).unbind('keyup', onKeyup);
            isShow = false;
            if (options.onClose) {
                options.onClose();
            }
        }

        return $(this).each(init);
    }
})(jQuery);