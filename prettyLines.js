var PrettyLines = (function (opt) {
    "use strict";
    var self = this,
        initialized = false,
        canvas,
        context,
        lineWidth = 4,
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
        incomingLine_context,
        incomingLine_canvas,
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
        INCOMING_LINE_CANVAS_ID = "incomingCanvas",
        MAIN_CANVAS_ID = opt.canvas
        ;

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

        document.querySelector("#" + CANVAS_CONTAINER_ID).appendChild(createAndGetCanvas(INCOMING_LINE_CANVAS_ID, canvasWidth, canvasHeight));
        document.querySelector("#" + CANVAS_CONTAINER_ID).appendChild(createAndGetCanvas(BEZIER_LINE_CANVAS_ID, canvasWidth, canvasHeight));
        document.querySelector("#" + CANVAS_CONTAINER_ID).appendChild(createAndGetCanvas(TMP_CANVAS_ID, canvasWidth, canvasHeight));

        document.getElementById(INCOMING_LINE_CANVAS_ID).setAttribute('style', 'position: absolute; top: 0; left: 0; visibility: hidden');
        document.getElementById(BEZIER_LINE_CANVAS_ID).setAttribute('style', 'position: absolute; top: 0; left: 0; visibility: hidden');
        document.getElementById(TMP_CANVAS_ID).setAttribute('style', 'position: absolute; top: 0; left: 0;');

        var __retTmp = initializeCanvas(TMP_CANVAS_ID, tmp_context, canvas);
        tmp_canvas = __retTmp.canvas;
        tmp_context = __retTmp.context;

        var __retBez = initializeCanvas(BEZIER_LINE_CANVAS_ID, bezierLine_context, canvas);
        bezierLine_canvas = __retBez.canvas;
        bezierLine_context = __retBez.context;

        var __retIncoming = initializeCanvas(INCOMING_LINE_CANVAS_ID, incomingLine_context, canvas);
        incomingLine_canvas = __retIncoming.canvas;
        incomingLine_context = __retIncoming.context;

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
        var tmpLastLinesAt = lastLinesAt;
        if(lastLinesAt-2 >= 0) {
            tmpLastLinesAt = lastLinesAt-2;
        } else if(lastLinesAt-1 >= 0) {
            tmpLastLinesAt = lastLinesAt-1;
        }

        bezierLine_context.moveTo(canvas_points[tmpLastLinesAt].x, canvas_points[tmpLastLinesAt].y);

        for (var i = tmpLastLinesAt; i < canvas_points.length - 2; i++) {
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
            switch (e.which) {
                case 1:
                    canvas_points.push({x: e._x, y: e._y});
                    bezier_canvas_points.push({x: e._x, y: e._y});
                    lastLinesAt = 0;
                    tool.started = true;
                    break;
                case 2:
                    //alert('Middle mouse button pressed');
                    break;
                case 3:
                    tool.started = false;
                    break;
                default:
                    //alert('You have a strange mouse');
            }

        };

        var xBeforeEvent, yBeforeEvent;

        this.mousemove = function (e) {
            if(tool.started) {

                self.clearCanvas(bezierLine_context);
                self.clearCanvas(tmp_context);

                canvas_points.push({x: e._x, y: e._y});

                xBeforeEvent = bezier_canvas_points[bezier_canvas_points.length-1].x;
                yBeforeEvent = bezier_canvas_points[bezier_canvas_points.length-1].y;

                if(e._x > xBeforeEvent + 4 || e._x < xBeforeEvent - 4 ||
                    e._y > yBeforeEvent + 4 || e._y < yBeforeEvent - 4) {
                    bezier_canvas_points.push({x: e._x, y: e._y});
                    lastLinesAt = canvas_points.length-2;
                }

                tmp_context.beginPath();
                tmp_context.moveTo(canvas_points[0].x, canvas_points[0].y);

                for (var i = 0; i < canvas_points.length - 3; i++) {
                    var f = (canvas_points[i+1].x + canvas_points[i + 2].x) / 2;
                    var g = (canvas_points[i+1].y + canvas_points[i + 2].y) / 2;
                    tmp_context.bezierCurveTo(canvas_points[i].x, canvas_points[i].y, canvas_points[i+1].x, canvas_points[i+1].y, f, g);
                }

                tmp_context.stroke();

                bezierLine_context.beginPath();
                bezierLine_context.moveTo(bezier_canvas_points[0].x, bezier_canvas_points[0].y);

                for (i = 0; i < bezier_canvas_points.length-2; i++) {
                    f = (bezier_canvas_points[i+1].x + bezier_canvas_points[i + 2].x) / 2;
                    g = (bezier_canvas_points[i+1].y + bezier_canvas_points[i + 2].y) / 2;
                    bezierLine_context.bezierCurveTo(bezier_canvas_points[i].x, bezier_canvas_points[i].y, bezier_canvas_points[i+1].x, bezier_canvas_points[i+1].y, f, g);
                }

                bezierLine_context.stroke();

                drawCallback(canvas.toDataURL("image/png"));

                if(canvas_points.length > 36) {

                    //drawLastNotPrettyPointsWithBezierCurve();

                    var xTmpCanvasPoints = canvas_points[canvas_points.length-2].x;
                    var yTmpCanvasPoints = canvas_points[canvas_points.length-2].y;

                    var xTmpBezierCanvasPoints = bezier_canvas_points[bezier_canvas_points.length-2].x;
                    var yTmpBezierCanvasPoints = bezier_canvas_points[bezier_canvas_points.length-2].y;

                    resetPointArrayAndPointCounter();

                    canvas_points.push({x: xTmpCanvasPoints, y: yTmpCanvasPoints});
                    canvas_points.push({x: e._x, y: e._y});

                    bezier_canvas_points.push({x: xTmpBezierCanvasPoints, y: yTmpBezierCanvasPoints});
                    bezier_canvas_points.push({x: e._x, y: e._y});

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
                    if (canvas_points.length <= 36) {
                        self.clearCanvas(bezierLine_context);
                        drawFirstNotPrettyPointsWithBezierCurve();
                    }
                    drawLastNotPrettyPointsWithBezierCurve();
                }

                drawCallback(canvas.toDataURL("image/png"));

                context.drawImage(bezierLine_canvas, 0, 0);

                self.clearCanvas(tmp_context);
                self.clearCanvas(bezierLine_context);

                resetPointArrayAndPointCounter();

                tool.started = false;
            }
        }
    }

    document.onmouseup = function(e){
        tool.mouseup(e);
    };

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

    self.setLineColor = function(col) {
        strokeStyle = col;
        context.strokeStyle = strokeStyle;
    };

    var drawCallback = function(a) {};

    self.onDraw = function(callback) {
        drawCallback = callback;
    };

    self.receiveDrawnLines = function (string) {
        blob2canvas(string);
        context.drawImage(incomingLine_canvas, 0, 0);
        self.clearCanvas(incomingLine_context);
    };

    function blob2canvas(blob){
        var img = new Image();
        img.onload = function () {
            incomingLine_context.drawImage(img,0,0);
        };
        img.src = blob;
    }

    self.clearCanvas = function (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

});
