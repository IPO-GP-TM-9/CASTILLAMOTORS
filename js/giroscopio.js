const btn = document.getElementById("btn");
const data = document.getElementById("data");

btn.onclick = async () => {
  // iOS requiere permiso explícito
  if (typeof DeviceOrientationEvent.requestPermission === "function") {
    const permiso = await DeviceOrientationEvent.requestPermission();
    if (permiso !== "granted") {
      data.textContent = "Permiso denegado";
      return;
    }
  }

  window.addEventListener("deviceorientation", (e) => {
    data.textContent = `
    alpha (compás): ${e.alpha}
    beta (inclinación X): ${e.beta}
    gamma (inclinación Y): ${e.gamma}
    `;
  });
};
