from flask import Flask, request, jsonify, send_from_directory
from diffusers import StableDiffusionPipeline
from PIL import Image
import io
import base64

app = Flask(__name__, static_folder='.')

# Stable Diffusion modelini yükle (model adını istediğinizle değiştirebilirsiniz)
pipeline = StableDiffusionPipeline.from_pretrained("stabilityai/stable-diffusion-xl-base-1.0")
# Eğer GPU kullanıyorsanız
# pipeline.to("cuda")

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# ... (diğer statik rota tanımlamalarınız varsa) ...

@app.route('/generate_image', methods=['POST'])
def generate_image():
    data = request.get_json()
    drawing_base64 = data.get('drawing')

    if not drawing_base64:
        return jsonify({'error': 'Çizim verisi eksik'}), 400

    try:
        # Base64 verisini PIL Image nesnesine dönüştür
        image_data = base64.b64decode(drawing_base64.split(',')[1])
        drawing_image = Image.open(io.BytesIO(image_data)).convert("RGB")
        drawing_image = drawing_image.resize((512, 512)) # Modelin beklediği boyuta yeniden boyutlandır

        # Stable Diffusion ile görüntü üret
        prompt = "a detailed and realistic image based on the user's drawing" # Basit bir prompt
        generated_image = pipeline(prompt=prompt, image=drawing_image).images[0]

        # Üretilen görüntüyü base64 formatına dönüştür ve frontend'e gönder
        buffered = io.BytesIO()
        generated_image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
        image_url = f"data:image/png;base64,{img_str}"

        return jsonify({'image_url': image_url})

    except Exception as e:
        return jsonify({'error': f'Görüntü oluşturulurken bir hata oluştu: {str(e)}'}), 500