
const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");

const penBtn = document.getElementById("penBtn");
const eraserBtn = document.getElementById("eraserBtn");
const clearBtn = document.getElementById("clearBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const penColorInput = document.getElementById("penColor");
const penSizeInput = document.getElementById("penSize");
const eraserCursor = document.getElementById("eraserCursor");
const symmetryBtn = document.getElementById("symmetryBtn");

let currentTool = "pen";
let drawing = false;
let lastX = 0;
let lastY = 0;
let eraserSize = 30;
let pathHistory = [];
let redoHistory = [];
let isSymmetryEnabled = false; 

ctx.strokeStyle = penColorInput.value;
ctx.lineWidth = penSizeInput.value;
ctx.lineCap = "round";

eraserCursor.style.position = "absolute";
eraserCursor.style.border = "2px solid gray";
eraserCursor.style.borderRadius = "50%";
eraserCursor.style.pointerEvents = "none";
eraserCursor.style.display = "none";

function startDrawing(e) {
  drawing = true;
  [lastX, lastY] = [e.offsetX, e.offsetY];
}

function draw(e) {
  if (!drawing) return;

  if (currentTool === "pen") {
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();

    if (isSymmetryEnabled) {
      ctx.beginPath();
      ctx.moveTo(canvas.width - lastX, lastY);
      ctx.lineTo(canvas.width - e.offsetX, e.offsetY);
      ctx.stroke();
    }
  } else if (currentTool === "eraser") {
    ctx.clearRect(e.offsetX - eraserSize / 2, e.offsetY - eraserSize / 2, eraserSize, eraserSize);
  }

  [lastX, lastY] = [e.offsetX, e.offsetY];
  updateEraserCursor(e);
}

function stopDrawing() {
  if (drawing) {
    drawing = false;
    saveCanvasState();
  }
}

function updateEraserCursor(e) {
  if (currentTool === "eraser") {
    eraserCursor.style.display = "block";
    eraserCursor.style.width = `${eraserSize}px`;
    eraserCursor.style.height = `${eraserSize}px`;
    eraserCursor.style.left = `${e.clientX - eraserSize / 2}px`;
    eraserCursor.style.top = `${e.clientY - eraserSize / 2}px`;
  }
}

canvas.addEventListener("mousedown", (e) => {
  startDrawing(e);
  updateEraserCursor(e);
});
canvas.addEventListener("mousemove", (e) => {
  draw(e);
  updateEraserCursor(e);
});
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseout", () => {
  stopDrawing();
  eraserCursor.style.display = "none";
});

penBtn.addEventListener("click", () => {
  currentTool = "pen";
  eraserCursor.style.display = "none";
});

eraserBtn.addEventListener("click", () => {
  currentTool = "eraser";
});

penSizeInput.addEventListener("input", (e) => {
  ctx.lineWidth = e.target.value * 2;
  eraserSize = e.target.value * 10;
});

penColorInput.addEventListener("input", (e) => {
  ctx.strokeStyle = e.target.value;
});

clearBtn.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pathHistory = [];
  redoHistory = [];
  saveCanvasState();
});

undoBtn.addEventListener("click", () => {
  if (pathHistory.length > 1) {
    redoHistory.push(pathHistory.pop());
    restoreCanvasState();
  }
});

redoBtn.addEventListener("click", () => {
  if (redoHistory.length > 0) {
    pathHistory.push(redoHistory.pop());
    restoreCanvasState();
  }
});

function saveCanvasState() {
  pathHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

function restoreCanvasState() {
  const lastState = pathHistory[pathHistory.length - 1];
  ctx.putImageData(lastState, 0, 0);
}

window.onload = () => {
  saveCanvasState();
};

const fillBtn = document.getElementById("fillToolBtn");
const fillColorInput = document.getElementById("fillColor");

fillBtn.addEventListener("click", () => currentTool = "fill");

function floodFill(startX, startY, fillColor) {
  const canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = canvasData.data;
  const stack = [[startX, startY]];

  const startIdx = (startY * canvas.width + startX) * 4;
  const startColor = {
    r: data[startIdx],
    g: data[startIdx + 1],
    b: data[startIdx + 2],
    a: data[startIdx + 3],
  };

  function matchColor(idx) {
    return (
      data[idx] === startColor.r &&
      data[idx + 1] === startColor.g &&
      data[idx + 2] === startColor.b &&
      data[idx + 3] === startColor.a
    );
  }

  function colorPixel(idx) {
    data[idx] = fillColor.r;
    data[idx + 1] = fillColor.g;
    data[idx + 2] = fillColor.b;
    data[idx + 3] = 255; 
  }

  while (stack.length) {
    const [x, y] = stack.pop();
    const idx = (y * canvas.width + x) * 4;

    if (!matchColor(idx)) continue;
    colorPixel(idx);

    if (x > 0) stack.push([x - 1, y]);
    if (x < canvas.width - 1) stack.push([x + 1, y]);
    if (y > 0) stack.push([x, y - 1]);
    if (y < canvas.height - 1) stack.push([x, y + 1]);
  }

  ctx.putImageData(canvasData, 0, 0);
}

canvas.addEventListener("click", (e) => {
  if (currentTool === "fill") {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);
    const fillColor = hexToRGB(fillColorInput.value); 
    floodFill(x, y, fillColor);
    saveCanvasState();
  }
});

function hexToRGB(hex) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

symmetryBtn.addEventListener("click", () => {
  isSymmetryEnabled = !isSymmetryEnabled;
  symmetryBtn.style.backgroundColor = isSymmetryEnabled ? "#4CAF50" : "";
});
