import os
import torch
from pest_detection.model import PestDetector

def download_model():
    # Create models directory if it doesn't exist
    os.makedirs('models', exist_ok=True)
    
    # Initialize the model
    model = PestDetector(num_classes=4)
    
    # Save the model with random weights (for now)
    model_path = os.path.join('models', 'pest_detection.pth')
    torch.save(model.state_dict(), model_path)
    print(f"Model saved to {model_path}")
    
    # Verify the model can be loaded
    loaded_model = PestDetector(num_classes=4)
    loaded_model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
    print("Model loaded successfully")

if __name__ == '__main__':
    download_model()
