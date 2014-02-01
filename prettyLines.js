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
        xBeforeEvent,
        yBeforeEvent,
        incomingLine_context,
        incomingLine_canvas,
        bezierIncomingLine_context,
        bezierIncomingLine_canvas,
        canvas_points = [],
        bezier_canvas_points = [],
        incoming_canvas_points = [],
        bezier_incoming_canvas_points = [],
        xBeforeIncomingEvent,
        yBeforeIncomingEvent,
        incomingLastLinesAt,
        errors = [
            "error canvas element not found",
            "error canvas context not found",
            "error context 2d not found"
        ],
        TMP_CANVAS_ID = "tmpCanvas",
        CANVAS_CONTAINER_ID = "canvasContainer",
        BEZIER_LINE_CANVAS_ID = "beautyCanvas",
        INCOMING_LINE_CANVAS_ID = "incomingCanvas",
        BEZIER_INCOMING_LINE_CANVAS_ID = "bezierIncomingCanvas",
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
        document.querySelector("#" + CANVAS_CONTAINER_ID).appendChild(createAndGetCanvas(BEZIER_INCOMING_LINE_CANVAS_ID, canvasWidth, canvasHeight));
        document.querySelector("#" + CANVAS_CONTAINER_ID).appendChild(createAndGetCanvas(BEZIER_LINE_CANVAS_ID, canvasWidth, canvasHeight));
        document.querySelector("#" + CANVAS_CONTAINER_ID).appendChild(createAndGetCanvas(TMP_CANVAS_ID, canvasWidth, canvasHeight));

        document.getElementById(INCOMING_LINE_CANVAS_ID).setAttribute('style', 'position: absolute; top: 0; left: 0; visibility: hidden');
        document.getElementById(BEZIER_INCOMING_LINE_CANVAS_ID).setAttribute('style', 'position: absolute; top: 0; left: 0; visibility: hidden');
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

        var __retIncomingBez = initializeCanvas(BEZIER_INCOMING_LINE_CANVAS_ID, bezierIncomingLine_context, canvas);
        bezierIncomingLine_canvas = __retIncomingBez.canvas;
        bezierIncomingLine_context = __retIncomingBez.context;

        tool = new Tool_Pencil();

        tmp_canvas.addEventListener('mousedown', e_canvas, false);
        tmp_canvas.addEventListener('mousemove', e_canvas, false);
        tmp_canvas.addEventListener('mouseup', e_canvas, false);
        tmp_canvas.addEventListener("mouseout", e_canvas, false);

    }

    function e_canvas(e) {
        e._x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
        e._y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;

        var func = tool[e.type];
        if(func) {
            func(e);
        }
    }

    function resetPointArrayAndPointCounter(pointArray, bPointArray) {
        pointArray.length = 0;
        bPointArray.length = 0;
    }

    function drawPoint(pointArray, context) {
        var start_point = pointArray[0];
        context.beginPath();
        context.arc(start_point.x, start_point.y, context.lineWidth / 2, 0, Math.PI * 2, false);
        context.fillStyle = strokeStyle;
        context.fill();
        context.closePath();
    }

    function drawFirstNotPrettyPointsWithBezierCurve(bContext, lastLine, lineArray) {
        bContext.beginPath();
        bContext.moveTo(lineArray[0].x, lineArray[0].y);

        for (var i = 0; i < lastLine - 2; i++) {
            var f = (lineArray[i + 1].x + lineArray[i + 2].x) / 2;
            var g = (lineArray[i + 1].y + lineArray[i + 2].y) / 2;
            bContext.bezierCurveTo(lineArray[i].x, lineArray[i].y, lineArray[i + 1].x, lineArray[i + 1].y, f, g);
        }

        bContext.stroke();
    }

    function drawLastNotPrettyPointsWithBezierCurve(bContext,lastLine,pointArray) {
        bContext.beginPath();
        var tmpLastLinesAt = lastLine;
        if(lastLine-2 >= 0) {
            tmpLastLinesAt = lastLine-2;
        } else if(lastLine-1 >= 0) {
            tmpLastLinesAt = lastLine-1;
        }

        bContext.moveTo(pointArray[tmpLastLinesAt].x, pointArray[tmpLastLinesAt].y);

        for (var i = tmpLastLinesAt; i < pointArray.length - 2; i++) {
            var f = (pointArray[i + 1].x + pointArray[i + 2].x) / 2;
            var g = (pointArray[i + 1].y + pointArray[i + 2].y) / 2;
            bContext.bezierCurveTo(pointArray[i].x, pointArray[i].y, pointArray[i + 1].x, pointArray[i + 1].y, f, g);
        }
        bContext.stroke();
    }

    function drawPointsOnCanvas (context, pointArray, minusLength) {
        context.beginPath();
        context.moveTo(pointArray[0].x, pointArray[0].y);

        for (var i = 0; i < pointArray.length - minusLength; i++) {
            var f = (pointArray[i+1].x + pointArray[i + 2].x) / 2;
            var g = (pointArray[i+1].y + pointArray[i + 2].y) / 2;
            context.bezierCurveTo(pointArray[i].x, pointArray[i].y, pointArray[i+1].x, pointArray[i+1].y, f, g);
        }

        context.stroke();
    }

    function drawBezierCanvasOnCanvas(pointArray,bPointArray,x,y,bCanvas) {
        var xTmpCanvasPoints = pointArray[pointArray.length-2].x;
        var yTmpCanvasPoints = pointArray[pointArray.length-2].y;

        var xTmpBezierCanvasPoints = bPointArray[bPointArray.length-2].x;
        var yTmpBezierCanvasPoints = bPointArray[bPointArray.length-2].y;

        resetPointArrayAndPointCounter(pointArray,bPointArray);

        pointArray.push({x: xTmpCanvasPoints, y: yTmpCanvasPoints});
        pointArray.push({x: x, y: y});

        bPointArray.push({x: xTmpBezierCanvasPoints, y: yTmpBezierCanvasPoints});
        bPointArray.push({x: x, y: y});

        context.drawImage(bCanvas, 0, 0);
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
                    drawStartCallback(e._x, e._y);
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

        this.mousemove = function (e) {
            if(tool.started) {

                self.clearCanvas(bezierLine_context);
                self.clearCanvas(tmp_context);

                canvas_points.push({x: e._x, y: e._y});
                drawCallback(e._x, e._y);

                xBeforeEvent = bezier_canvas_points[bezier_canvas_points.length-1].x;
                yBeforeEvent = bezier_canvas_points[bezier_canvas_points.length-1].y;

                if(e._x > xBeforeEvent + 4 || e._x < xBeforeEvent - 4 ||
                    e._y > yBeforeEvent + 4 || e._y < yBeforeEvent - 4) {
                    bezier_canvas_points.push({x: e._x, y: e._y});
                    lastLinesAt = canvas_points.length-2;
                }

                drawPointsOnCanvas(tmp_context,canvas_points,3);
                drawPointsOnCanvas(bezierLine_context,bezier_canvas_points,2);

                if(canvas_points.length > 36) {
                    drawBezierCanvasOnCanvas(canvas_points,bezier_canvas_points,e._x,e._y,bezierLine_canvas);
                    lastLinesAt = 0;
                }
            }
        };

        this.mouseup = function (e) {
            if(tool.started) {

                drawEndCallback();

                if(canvas_points.length < 3) {
                    drawPoint(canvas_points, bezierLine_context);
                } else {
                    if (canvas_points.length <= 36) {
                        self.clearCanvas(bezierLine_context);
                        drawFirstNotPrettyPointsWithBezierCurve(bezierLine_context,lastLinesAt,canvas_points);
                    }
                    drawLastNotPrettyPointsWithBezierCurve(bezierLine_context, lastLinesAt, canvas_points);
                }

                context.drawImage(bezierLine_canvas, 0, 0);
                self.clearCanvas(tmp_context);
                self.clearCanvas(bezierLine_context);

                resetPointArrayAndPointCounter(canvas_points,bezier_canvas_points);
                lastLinesAt = 0;

                tool.started = false;
            }
        };

        this.mouseout = function (e) {
            canvas_points.push({x: e._x, y: e._y});
            drawLastNotPrettyPointsWithBezierCurve(bezierLine_context, lastLinesAt, canvas_points);
            tool.mouseup(e);
        };
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

    var drawStartCallback = function(x,y) {};

    self.onDrawStart = function(callback) {
        drawStartCallback = callback;
    };

    self.receiveDrawStart = function (x,y) {
        incoming_canvas_points.push({x: x, y: y});
        bezier_incoming_canvas_points.push({x: x, y: y});
        incomingLastLinesAt = 0;
    };

    var drawCallback = function(x, y) {};

    self.onDraw = function(callback) {
        drawCallback = callback;
    };

    self.receiveDrawnLines = function (x, y) {

        self.clearCanvas(bezierIncomingLine_context);
        self.clearCanvas(incomingLine_context);

        incoming_canvas_points.push(x,y);

        xBeforeIncomingEvent = bezier_canvas_points[bezier_canvas_points.length-1].x;
        yBeforeIncomingEvent = bezier_canvas_points[bezier_canvas_points.length-1].y;

        if(x > xBeforeIncomingEvent + 4 || x < xBeforeIncomingEvent - 4 ||
            y > yBeforeIncomingEvent + 4 || y < yBeforeIncomingEvent - 4) {
            bezier_incoming_canvas_points.push({x: x, y: y});
            incomingLastLinesAt = canvas_points.length-2;
        }

        drawPointsOnCanvas(incomingLine_context,incoming_canvas_points,3);
        drawPointsOnCanvas(bezierIncomingLine_context,bezier_incoming_canvas_points,2);

        if(incoming_canvas_points.length > 36) {
            drawBezierCanvasOnCanvas(incoming_canvas_points,bezier_incoming_canvas_points,x,y,bezierIncomingLine_canvas);
            lastLinesAt = 0;
        }
    };

    var drawEndCallback = function() {};

    self.onDrawEnd = function(callback) {
        drawEndCallback = callback;
    };

    self.receiveDrawEnd = function() {
        if(incoming_canvas_points.length != null && incoming_canvas_points.length != 0) {
            if(incoming_canvas_points.length < 3) {
                drawPoint(incoming_canvas_points, bezierIncomingLine_context);
            } else {
                if (incoming_canvas_points.length <= 36) {
                    self.clearCanvas(bezierIncomingLine_context);
                    drawFirstNotPrettyPointsWithBezierCurve(bezierIncomingLine_context, incomingLastLinesAt, incoming_canvas_points);
                }
                drawLastNotPrettyPointsWithBezierCurve(bezierIncomingLine_context, incomingLastLinesAt, incoming_canvas_points);
            }
        }

        context.drawImage(bezierIncomingLine_canvas, 0, 0);
        self.clearCanvas(incomingLine_context);
        self.clearCanvas(bezierIncomingLine_context);

        resetPointArrayAndPointCounter(incoming_canvas_points,bezier_incoming_canvas_points);
        incomingLastLinesAt = 0;

    };

    self.clearCanvas = function (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

});
