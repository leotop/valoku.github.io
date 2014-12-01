$( document ).ready(function() {
    showLoadingSpinner();
});

$(window).load(function () {
    hideLoadingSpinner();
    var imageElement = document.getElementById('canvas-image-source');
    if (imageElement == null) return;
    var canvasContainer = document.getElementById('canvas-container');
    var canvasContext = document.getElementById('image-canvas').getContext('2d');
    drawImage();

    function getDefaultFilters() {
        return {
            brightness: 0,
            contrast: 0,
            hue: 100,
            saturation: 0,
            vignette: "0%"
        }
    }

    var camanFilters = getDefaultFilters();

    function setContextFilters(context) {
        context.brightness(camanFilters.brightness);
        context.contrast(camanFilters.contrast);
        context.hue(camanFilters.hue);
        context.saturation(camanFilters.saturation);
        context.vignette(camanFilters.vignette);
    }

    function drawImage() {
        setCanvasInitSize();
        Caman(canvasContext.canvas, imageElement.src, function () {
//            this.revert(false);
            if (canvasContext.canvas != null) {
                this.resize({
                    width: canvasContainer.width,
                    height: canvasContainer.height
                });
            }
            setContextFilters(this);
            this.render();
        });
    }

    function applyFilters() {
        Caman(canvasContext.canvas, function () {
            this.revert(false);
            setContextFilters(this);
            this.render();
        });
    }

    function setCanvasInitSize() {
        var maxCanvasWidth = 900;
        var canvasWidth = maxCanvasWidth;
        var canvasHeight = imageElement.naturalHeight / (imageElement.naturalWidth / canvasWidth);
        canvasContainer.width = canvasWidth;
        canvasContainer.height = canvasHeight;
        canvasContext.canvas.height = canvasHeight;
        canvasContext.canvas.width = canvasWidth;
    }

    var brightnessSlider = document.getElementById('brightness-slider');
    var contrastSlider = document.getElementById('contrast-slider');
    var saturationSlider = document.getElementById('saturation-slider');
    var hueSlider = document.getElementById('hue-slider');
    var vignetteSlider = document.getElementById('vignette-slider');


    brightnessSlider.onchange = onSliderInput;
    contrastSlider.onchange = onSliderInput;
    saturationSlider.onchange = onSliderInput;
    hueSlider.onchange = onSliderInput;
    vignetteSlider.onchange = onSliderInput;

    function onSliderInput() {
        camanFilters.brightness = brightnessSlider.value;
        camanFilters.contrast = parseInt(contrastSlider.value);
        camanFilters.hue = hueSlider.value;
        camanFilters.saturation = saturationSlider.value;
        camanFilters.vignette = vignetteSlider.value + "%";
        Foundation.utils.debounce(applyFilters(), 500);
    }

    var resetButton = document.getElementById('reset-button');
    resetButton.onclick = resetButtonPressed;

    function resetButtonPressed() {
        camanFilters = getDefaultFilters();
        brightnessSlider.value = camanFilters.brightness;
        contrastSlider.value = camanFilters.contrast;
        hueSlider.value = camanFilters.hue;
        saturationSlider.value = camanFilters.saturation;
        vignetteSlider.value = parseInt(camanFilters.saturation);
        Foundation.utils.debounce(applyFilters(), 500);
    }

    var saveButton = document.getElementById('save-button');
    saveButton.onclick = saveButtonPressed;

    function saveButtonPressed() {
        showLoadingSpinner();
        //We need to clone the image element and later add it
        //to the DOM because the call to Caman's render()
        //replaces the img element with canvas
        var imageElementClone = imageElement.cloneNode(true)
        Caman(imageElement, function () {
            this.revert(false);
            setContextFilters(this);
            this.render(function () {
                imageQuality = 0.5;
                var image = this.toBase64("jpeg", imageQuality);
                saveToServer(image);
                //We now remove the canvas element that took the place of the img
                imageElement = document.getElementById("canvas-image-source");
                imageElement.parentNode.removeChild(imageElement);
                //Then we add the clone to the DOM and assign it to imageElement
                document.body.appendChild(imageElementClone);
                imageElement = imageElementClone;
                hideLoadingSpinner();
            });
        });
    }

    /**Start of copy pasted csrf django stuff */

    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    function sameOrigin(url) {
        // test that a given url is a same-origin URL
        // url could be relative or scheme relative or absolute
        var host = document.location.host; // host + port
        var protocol = document.location.protocol;
        var sr_origin = '//' + host;
        var origin = protocol + sr_origin;
        // Allow absolute or scheme relative URLs to same origin
        return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
            (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
            // or any other URL that isn't scheme relative or absolute i.e relative.
            !(/^(\/\/|http:|https:).*/.test(url));
    }


    /**End of copy pasted csrf django stuff */

    function saveToServer(image) {
        var csrftoken = $.cookie('csrftoken');
        $.ajaxSetup({
            beforeSend: function (xhr, settings) {
                if (!csrfSafeMethod(settings.type) && sameOrigin(settings.url)) {
                    // Send the token to same-origin, relative URLs only.
                    // Send the token only if the method warrants CSRF protection
                    // Using the CSRFToken value acquired earlier
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            }
        });
        var url = '/save_edited_file/' + $('#hidden-image-id').text()
        jQuery.ajax({
            url: url,
            type: 'POST',
            data: image,
            cache: false,
            processData: false,
            contentType: false,
            success: function (data) {
                console.log(data);
            }
        });
    }
});

var spinner;
function showLoadingSpinner() {
    var canvasContainerDiv = document.getElementById('canvas-container');
    spinnerOptions = {

    };
    spinner = new Spinner(spinnerOptions).spin(canvasContainerDiv);
}

function hideLoadingSpinner() {
    if (spinner) {
        spinner.stop();
    }
}

