const imageUpload = document.getElementById('imageUpload')

// đáp ứng được mới then 
Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('./models')
]).then(start)

// tìm label faces
async function start() {
  const container = document.createElement('div')
  container.style.position = 'relative'
  document.body.append(container)
  const labeledFaceDescriptors = await loadLabeledImages()   // các label chứa miêu tả
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6) // so sánh khuôn mặt tham chiếu với truy vấn
  let image
  let canvas
  document.body.append('Loaded')
  imageUpload.addEventListener('change', async () => {
    if (image) image.remove()
    if (canvas) canvas.remove()
    image = await faceapi.bufferToImage(imageUpload.files[0])   //  load ảnh
    container.append(image)                 
    canvas = faceapi.createCanvasFromMedia(image) // tạo lớp canvas cho ảnh
    container.append(canvas)
    const displaySize = { width: image.width, height: image.height }  // khai báo kích thước
    faceapi.matchDimensions(canvas, displaySize)  // thay đổi kích thước lớp phủ theo kích thước đầu vào
    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors() // phát hiện các hộp 
    const resizedDetections = faceapi.resizeResults(detections, displaySize) // thay đổi kthuoc hộp phát hiện trong TH hình ảnh hiện thị kích thước khác ảnh gốc
    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor)) // bước này tìm ra face 1 người 
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box   // lấy từng hộp bằng cách phát hiện
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() }) // vẽ các hộp với tên
      drawBox.draw(canvas) // thêm canvas
    })
  })
}

function loadLabeledImages() {
  const labels = ['Black Widow', 'Captain America', 'Captain Marvel', 'Hawkeye', 'Jim Rhodes', 'Thor', 'Tony Stark']
  return Promise.all(
    labels.map(async label => {
      const descriptions = [] // chuỗi các miêu tả
      for (let i = 1; i <= 2; i++) {
        // tìm nạp ảnh từ 1 URL
        const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/VietMeo99/VDEV-Face-Recognition/Face-Recognition-JavaScript-master/master/labeled_images/${label}/${i}.jpg`)
        // tìm các phát hiện
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        descriptions.push(detections.descriptor) // đưa miêu tả các phát hiện vào
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions) // trả về label ứng với miêu tả
    })
  )
}
