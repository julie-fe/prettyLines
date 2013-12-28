var PrettyLines = (function (opt) {
    "use strict";
    var self = this,
        initialized = false,
        canvas,
        context,
        lineWidth = 5,
        lineJoin = "round",
        lineCap = "round",
        strokeStyle = opt.lineColor,
        tool,
        canvasWidth,
        canvasHeight,
        lastLinesAt,
        tmp_context,
        tmp_canvas,
        bezierLine_context,
        bezierLine_canvas,
        canvas_points = [],
        bezier_canvas_points = [],
        errors = [
            "error canvas element not found",
            "error canvas context not found",
            "error context 2d not found"
        ],
        TMP_CANVAS_ID = "tmpCanvas",
        CANVAS_CONTAINER_ID = "canvasContainer",
        BEZIER_LINE_CANVAS_ID = "beautyCanvas",
        MAIN_CANVAS_ID = opt.canvas
        ;

    function clearCanvas(context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    function initializeCanvas(canvasID, context, parentCanvas) {
        var canvas = document.querySelector("#" + canvasID);
        context = canvas.getContext('2d');

        canvas.width = parentCanvas.width;
        canvas.height = parentCanvas.height;

        context.lineWidth = lineWidth;
        context.lineJoin = lineJoin;
        context.lineCap = lineCap;
        context.strokeStyle = strokeStyle;

        return {canvas: canvas, context: context};
    }

    function createAndGetCanvas(id, width, height) {
        var canvas = document.createElement('canvas');
        canvas.id = id;
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }

    function init () {
        canvas = document.getElementById(MAIN_CANVAS_ID);

        if (!canvas) { console.log(errors[0]); return; }
        if (!canvas.getContext) { console.log(errors[1]); return; }

        context = canvas.getContext('2d');

        if (!context) { console.log(errors[2]); return; }

        canvasWidth = document.querySelector("#" + MAIN_CANVAS_ID).width;
        canvasHeight = document.querySelector("#" + MAIN_CANVAS_ID).height;

        var parent = document.querySelector("#" + MAIN_CANVAS_ID).parentNode;
        var canvasContainer = document.createElement('div');

        var position = 0;
        for(var i = 0; i < parent.childNodes.length; i++) {
            if(parent.childNodes[i] == document.querySelector("#" + MAIN_CANVAS_ID)) {
                position = i;
                break;
            }
        }

        canvasContainer.id = CANVAS_CONTAINER_ID;
        canvasContainer.appendChild(document.querySelector("#" + MAIN_CANVAS_ID));
        parent.insertBefore(canvasContainer, parent.childNodes[position]);

        document.querySelector("#" + CANVAS_CONTAINER_ID).appendChild(createAndGetCanvas(BEZIER_LINE_CANVAS_ID, canvasWidth, canvasHeight));
        document.querySelector("#" + CANVAS_CONTAINER_ID).appendChild(createAndGetCanvas(TMP_CANVAS_ID, canvasWidth, canvasHeight));

        document.getElementById(BEZIER_LINE_CANVAS_ID).setAttribute('style', 'position: absolute; top: 0; left: 0; visibility: hidden');
        document.getElementById(TMP_CANVAS_ID).setAttribute('style', 'position: absolute; top: 0; left: 0;');

        var __retTmp = initializeCanvas(TMP_CANVAS_ID, tmp_context, canvas);
        tmp_canvas = __retTmp.canvas;
        tmp_context = __retTmp.context;

        var __retBez = initializeCanvas(BEZIER_LINE_CANVAS_ID, bezierLine_context, canvas);
        bezierLine_canvas = __retBez.canvas;
        bezierLine_context = __retBez.context;

        tool = new Tool_Pencil();

        tmp_canvas.addEventListener('mousedown', e_canvas, false);
        tmp_canvas.addEventListener('mousemove', e_canvas, false);
        tmp_canvas.addEventListener('mouseup', e_canvas, false);

    }

    function e_canvas(e) {
        e._x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
        e._y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;

        var func = tool[e.type];
        if(func) {
            func(e);
        }
    }

    function resetPointArrayAndPointCounter() {
        canvas_points = [];
        bezier_canvas_points = [];
        lastLinesAt = 0;
    }

    function drawFirstNotPrettyPointsWithBezierCurve() {
        bezierLine_context.beginPath();
        bezierLine_context.moveTo(canvas_points[0].x, canvas_points[0].y);

        for (var i = 0; i < lastLinesAt - 2; i++) {
            var f = (canvas_points[i + 1].x + canvas_points[i + 2].x) / 2;
            var g = (canvas_points[i + 1].y + canvas_points[i + 2].y) / 2;
            bezierLine_context.bezierCurveTo(canvas_points[i].x, canvas_points[i].y, canvas_points[i + 1].x, canvas_points[i + 1].y, f, g);
        }

        bezierLine_context.stroke();
    }

    function drawLastNotPrettyPointsWithBezierCurve() {
        bezierLine_context.beginPath();
        if(lastLinesAt-1 >= 0) {
            bezierLine_context.moveTo(canvas_points[lastLinesAt-1].x, canvas_points[lastLinesAt-1].y);
        } else {
            bezierLine_context.moveTo(canvas_points[lastLinesAt].x, canvas_points[lastLinesAt].y);
        }


        for (var i = lastLinesAt; i < canvas_points.length - 2; i++) {
            var f = (canvas_points[i + 1].x + canvas_points[i + 2].x) / 2;
            var g = (canvas_points[i + 1].y + canvas_points[i + 2].y) / 2;
            bezierLine_context.bezierCurveTo(canvas_points[i].x, canvas_points[i].y, canvas_points[i + 1].x, canvas_points[i + 1].y, f, g);
        }

        bezierLine_context.stroke();
    }

    function Tool_Pencil() {
        var tool = this;
        this.started = false;

        this.mousedown = function (e) {
            canvas_points.push({x: e._x, y: e._y});
            bezier_canvas_points.push({x: e._x, y: e._y});
            lastLinesAt = 0;
            tool.started = true;
        };

        var xBeforeEvent, yBeforeEvent;

        this.mousemove = function (e) {
            if(tool.started) {

                clearCanvas(tmp_context);
                clearCanvas(bezierLine_context);

                canvas_points.push({x: e._x, y: e._y});

                xBeforeEvent = bezier_canvas_points[bezier_canvas_points.length-1].x;
                yBeforeEvent = bezier_canvas_points[bezier_canvas_points.length-1].y;

                if(e._x > xBeforeEvent + 6 || e._x < xBeforeEvent - 6 ||
                    e._y > yBeforeEvent + 6 || e._y < yBeforeEvent - 6) {
                    bezier_canvas_points.push({x: e._x, y: e._y});
                    lastLinesAt = canvas_points.length-2;
                }

                tmp_context.beginPath();
                tmp_context.moveTo(canvas_points[0].x, canvas_points[0].y);

                for (var i = 1; i < canvas_points.length - 3; i++) {
                    var f = (canvas_points[i+1].x + canvas_points[i + 2].x) / 2;
                    var g = (canvas_points[i+1].y + canvas_points[i + 2].y) / 2;
                    tmp_context.bezierCurveTo(canvas_points[i].x, canvas_points[i].y, canvas_points[i+1].x, canvas_points[i+1].y, f, g);
                }

                tmp_context.stroke();

                bezierLine_context.beginPath();
                bezierLine_context.moveTo(bezier_canvas_points[0].x, bezier_canvas_points[0].y);

                for (i = 1; i < bezier_canvas_points.length-2; i++) {
                    f = (bezier_canvas_points[i+1].x + bezier_canvas_points[i + 2].x) / 2;
                    g = (bezier_canvas_points[i+1].y + bezier_canvas_points[i + 2].y) / 2;
                    bezierLine_context.bezierCurveTo(bezier_canvas_points[i].x, bezier_canvas_points[i].y, bezier_canvas_points[i+1].x, bezier_canvas_points[i+1].y, f, g);
                }

                bezierLine_context.stroke();

                if(canvas_points.length > 36) {

                    drawLastNotPrettyPointsWithBezierCurve();

                    var xTmp3 = canvas_points[canvas_points.length-2].x;
                    var yTmp3 = canvas_points[canvas_points.length-2].y;

                    var xTmp = bezier_canvas_points[bezier_canvas_points.length-1].x;
                    var xTmp2 = bezier_canvas_points[bezier_canvas_points.length-2].x;
                    var yTmp = bezier_canvas_points[bezier_canvas_points.length-1].y;
                    var yTmp2 = bezier_canvas_points[bezier_canvas_points.length-2].y;

                    resetPointArrayAndPointCounter();

                    canvas_points.push({x: xTmp3, y: yTmp3});
                    canvas_points.push({x: e._x, y: e._y});

                    bezier_canvas_points.push({x: xTmp2, y: yTmp2});
                    bezier_canvas_points.push({x: xTmp, y: yTmp});

                    context.drawImage(bezierLine_canvas, 0, 0);
                }
            }
        };

        this.mouseup = function (e) {
            if(tool.started) {

                if(canvas_points.length < 3) {
                    var start_point = canvas_points[0];
                    bezierLine_context.beginPath();
                    bezierLine_context.arc(start_point.x, start_point.y, bezierLine_context.lineWidth / 2, 0, Math.PI * 2, false);
                    bezierLine_context.fillStyle = strokeStyle;
                    bezierLine_context.fill();
                    bezierLine_context.closePath();
                } else {
                    (canvas_points.length < 18) ? drawFirstNotPrettyPointsWithBezierCurve():"";
                    drawLastNotPrettyPointsWithBezierCurve();
                }

                context.drawImage(bezierLine_canvas, 0, 0);

                clearCanvas(tmp_context);
                clearCanvas(bezierLine_context);

                resetPointArrayAndPointCounter();

                tool.started = false;
            }
        }
    }

    var config = {
        autoInit: true,
        lineColor: "#ececec"
    };

    self.init = function () {
        if (!initialized) {
            initialized = true;
            init();
        }
    };

    self.setConfig = function (opt) {
        if (typeof opt == "object" && opt !== null) {
            for (var i in config) {
                if (config.hasOwnProperty(i) && opt[i] !== undefined)
                    config[i] = opt[i];
            }
        }
    };

    self.setConfig(opt);

    if (config.autoInit) {
        setTimeout(function () {
            self.init();
        }, 0);
    }

});
