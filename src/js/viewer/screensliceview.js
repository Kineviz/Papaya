class ScreenSliceView {
  constructor({ width = 300, height, plane, canvas, crosshairs = true, volume, viewer, onScroll }) {
    this.viewer = viewer;

    if (typeof canvas === "string") {
      canvas = document.getElementById(canvas);
    } else {
      canvas = document.createElement("canvas");
      canvas = canvas || Math.random().toString(36).substring(7);
      canvas.width = width;
      canvas.height = height || width;
    }

    this.plane = plane;
    this.canvas = canvas;
    this.crosshairs = crosshairs;
    this.volume = volume;
    this.cleanupOnDrawViewer = viewer.onDrawViewer(() => {
      this.refresh();
    });

    this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this));
    this.canvas.addEventListener("mouseout", this.onMouseOut.bind(this));
    this.canvas.addEventListener("click", this.onClick.bind(this));
    $(this.canvas).on('mousewheel DOMMouseScroll', this.onScroll.bind(this));
    this.eventListeners = {
      mousedown: [],
      mousemove: [],
      mouseup: [],
      mouseout: [],
      click: [],
      scroll: [],
    };

    if (onScroll) this.addEventListener("scroll", onScroll);
  }

  refresh() {
    this.viewer.drawSliceToCanvas(this);
  }

  setCrosshairs(crosshairs) {
    this.crosshairs = crosshairs;
  }

  setVolume(any, fn) {
    if (typeof any == 'object') {
      this.volume = any;
    } else {
      fn(this.volume[any] ?? {});
    }
    this.refresh();
  }

  adjustZoom(amount) {
    const nextZoomFactor = this.viewer.zoomFactor + amount
    this.viewer.setZoomLocation(this.viewer.currentCoord)
    this.viewer.setZoomFactor(nextZoomFactor)
  }

  zoomIn() {
    this.adjustZoom(0.1)
  }

  zoomOut() {
    this.adjustZoom(-0.1)
  }

  addEventListener(event, callback) {
    this.eventListeners[event].push(callback);
  }

  removeEventListener(event, callback) {
    this.eventListeners[event] = this.eventListeners[event].filter((cb) => cb !== callback);
  }

  notifyEventListeners(event, args) {
    this.eventListeners[event].forEach((cb) => cb(args, this));
  }

  getCanvas() {
    return this.canvas;
  }

  mouseEventToViewerCoord(event) {
    const rect = this.canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    let viewerCoord;
    this.viewer.withSlice(this, (slice) => {
      // Find the position of the click before it was transformed from the main viewer
      let x = (clickX - slice.finalTransform[0][2]) / slice.finalTransform[0][0] - 0.5;
      let y = (clickY - slice.finalTransform[1][2]) / slice.finalTransform[1][1] - 0.5;
      const [C, [X, Y]] = slice.getConstantDimension();
      viewerCoord = {
        [X]: x,
        [Y]: y,
        [C]: this.viewer.currentCoord[C],
      }
    });
    return viewerCoord;
  }

  onMouseDown(event) {
    this.mouse = "down";
    this.notifyEventListeners("mousedown", event);
  }

  onMouseMove(event) {
    if (this.mouse === "down") {
      Object.assign(this.viewer.currentCoord, this.mouseEventToViewerCoord(event));
      this.viewer.viewsChanged();
    }
    this.notifyEventListeners("mousemove", event);
  }

  onMouseUp(event) {
    if (this.mouse === "down") {
      this.mouse = "off";
      Object.assign(this.viewer.currentCoord, this.mouseEventToViewerCoord(event));
      this.viewer.viewsChanged(true);
    }
    this.notifyEventListeners("mouseup", event);
  }

  onMouseOut(event) {
    this.mouse = "off";
    this.notifyEventListeners("mouseout", event);
  }

  onClick(event) {
    this.notifyEventListeners("click", event);
  }

  onScroll(event) {
    this.notifyEventListeners("scroll", event);
  }
}

papaya.viewer.ScreenSliceView = ScreenSliceView;
