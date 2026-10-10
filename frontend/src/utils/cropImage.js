export const getCroppedFile = async (imageSrc, area, fileName) => {
  const image = new Image();
  image.src = imageSrc;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = area.width;
  canvas.height = area.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  return new File([blob], `${fileName}.jpg`, { type: "image/jpeg" });
};
