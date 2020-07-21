const imageUpload = document.getElementById('imageUpload') //在網頁中獲出id為imageUpload的資料

Promise.all([ //用promise 只是為了異步 
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),  //加載面部辨識網絡
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),   //加載面部特徵
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')       //加載SSD Mobilenet V1 Face Detector
]).then(start) //執行 function start()

async function start() {  //function start()
  const container = document.createElement('div') //建立一個HTML元素'div' 
  container.style.position = 'relative'           //上個程式碼建立的div的style
  document.body.append(container)                 //在HTML的Body的最尾
  const labeledFaceDescriptors = await loadLabeledImages() //載入面部數據 （要等他載入完）
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6) //比較面部資料，然後方入faceMatcher中
  let image //創立一個image變量
  let canvas //創立一個canvas變量
  document.body.append('Loaded') //在網頁中顯示 'Loaded'
  imageUpload.addEventListener('change', async () => {  //當資料發生改變時（type: change), 執行function (async)
    if (image) image.remove() //資料改變後 delete image
    if (canvas) canvas.remove() //資料改變後 delete canvas
    image = await faceapi.bufferToImage(imageUpload.files[0]) //imageUpload的相放入image變量中 
    container.append(image) //在網頁中顯示image
    canvas = faceapi.createCanvasFromMedia(image) //在image前建立canvas
    container.append(canvas) //在網頁中顯示canvas
    const displaySize = { width: image.width, height: image.height } //顯示的大小為圖像的大小
    faceapi.matchDimensions(canvas, displaySize) //準備canvas的大小為displaySize
    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors() //檢測image的面部，返回array /* Display detected face bounding boxes */
    const resizedDetections = faceapi.resizeResults(detections, displaySize) //調整檢測方格的大小
    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor)) //重新調整resizedDetections的array
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
      drawBox.draw(canvas)
    }) 
  })
}

function loadLabeledImages() {
  const labels = ['Black Widow', 'Captain America', 'Captain Marvel', 'Hawkeye', 'Jim Rhodes', 'Thor', 'Tony Stark', 'DANNY']
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/dnny60/test1/master/labeled_images/${label}/${i}.jpg`)
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        descriptions.push(detections.descriptor)
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}
