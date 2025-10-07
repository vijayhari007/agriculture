import os
import numpy as np
from PIL import Image
import torch
from torchvision import transforms
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models

# Define the model architecture
class PestDetector(nn.Module):
    def __init__(self, num_classes=4):
        super(PestDetector, self).__init__()
        # Use a pre-trained ResNet18 model
        self.model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
        
        # Replace the final fully connected layer
        num_ftrs = self.model.fc.in_features
        self.model.fc = nn.Sequential(
            nn.Linear(num_ftrs, 512),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(512, num_classes)
        )
    
    def forward(self, x):
        return self.model(x)

class PestDetectionModel:
    def __init__(self, model_path=None):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.classes = ['healthy', 'diseased', 'pest_infested', 'nutrient_deficiency']
        
        # Detailed treatment information for each condition with specific recommendations
        self.treatment_info = {
            'healthy': {
                'description': 'Your plant appears to be in good health!',
                'recommendations': [
                    'Continue with regular watering schedule (check soil moisture before watering)',
                    'Ensure 6-8 hours of sunlight daily',
                    'Rotate the plant periodically for even growth',
                    'Wipe leaves with a damp cloth monthly to remove dust',
                    'Inspect weekly for early signs of pests or disease'
                ],
                'care_tips': [
                    'Use room temperature water to avoid shocking the roots',
                    'Fertilize monthly during growing season with balanced fertilizer',
                    'Prune dead or yellowing leaves to encourage new growth',
                    'Check for proper drainage to prevent root rot'
                ]
            },
            'diseased': {
                'description': 'Your plant shows signs of disease.',
                'immediate_actions': [
                    '🚫 Isolate the plant immediately to prevent spreading',
                    '✂️ Prune affected leaves with sterilized shears',
                    '🧴 Apply appropriate fungicide (copper-based for fungal, bactericide for bacterial)',
                    '💧 Water at soil level, avoid wetting leaves'
                ],
                'treatment_plan': [
                    '1. Remove and destroy all infected plant material',
                    '2. Apply recommended treatment every 7-10 days',
                    '3. Improve air circulation around the plant',
                    '4. Disinfect tools after use to prevent spread'
                ],
                'prevention': [
                    'Water in the morning to allow leaves to dry',
                    'Space plants properly for good air flow',
                    'Use mulch to prevent soil-borne diseases',
                    'Choose disease-resistant plant varieties'
                ]
            },
            'pest_infested': {
                'description': 'Pest infestation detected on your plant.',
                'organic_solutions': [
                    '🐞 Release beneficial insects (ladybugs, lacewings)',
                    '🌿 Apply neem oil solution (2 tbsp neem oil + 1 tsp dish soap + 1 gallon water)',
                    '🧼 Use insecticidal soap spray for soft-bodied insects',
                    '🧄 Make garlic or chili pepper spray as a natural deterrent'
                ],
                'treatment_steps': [
                    '1. Isolate the affected plant',
                    '2. Remove visible pests with a strong water spray',
                    '3. Apply chosen treatment thoroughly (undersides of leaves too!)',
                    '4. Repeat every 5-7 days for 2-3 weeks',
                    '5. Monitor for new infestations'
                ],
                'prevention': [
                    'Inspect new plants before bringing them home',
                    'Keep the growing area clean and free of debris',
                    'Use yellow sticky traps for early detection',
                    'Encourage natural predators in your garden'
                ]
            },
            'nutrient_deficiency': {
                'description': 'Your plant shows signs of nutrient deficiency.',
                'common_deficiencies': {
                    'nitrogen': {
                        'symptoms': ['Yellowing of older leaves', 'Stunted growth', 'Smaller than normal leaves'],
                        'solutions': ['Apply balanced fertilizer (10-10-10)', 'Add compost or manure', 'Use fish emulsion']
                    },
                    'phosphorus': {
                        'symptoms': ['Dark green or purple leaves', 'Poor root development', 'Delayed maturity'],
                        'solutions': ['Apply bone meal', 'Use rock phosphate', 'Add composted manure']
                    },
                    'potassium': {
                        'symptoms': ['Brown leaf edges', 'Weak stems', 'Poor fruit development'],
                        'solutions': ['Apply potash', 'Use wood ash', 'Add banana peels to compost']
                    },
                    'magnesium': {
                        'symptoms': ['Yellowing between leaf veins', 'Leaf curling', 'Poor growth'],
                        'solutions': ['Apply Epsom salt (1 tbsp/gallon water)', 'Use dolomitic lime', 'Add compost']
                    }
                },
                'general_advice': [
                    'Conduct a soil test to confirm deficiencies',
                    'Maintain proper soil pH (6.0-7.0 for most plants)',
                    'Use organic matter to improve nutrient availability',
                    'Water consistently to prevent nutrient lockout'
                ]
            }
        }
        
        # Initialize the model
        self.model = PestDetector(num_classes=len(self.classes)).to(self.device)
        
        # Set default model path if not provided
        if model_path is None:
            model_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')
            model_path = os.path.join(model_dir, 'pest_detection.pth')
        
        # Load pretrained weights if available
        try:
            if os.path.exists(model_path):
                print(f"Loading model from {model_path}")
                # Load the state dict with map_location to ensure compatibility
                state_dict = torch.load(model_path, map_location=self.device)
                # Handle the case where the saved model is a DataParallel model
                if all(key.startswith('module.') for key in state_dict.keys()):
                    from collections import OrderedDict
                    new_state_dict = OrderedDict()
                    for k, v in state_dict.items():
                        name = k[7:]  # remove 'module.' prefix
                        new_state_dict[name] = v
                    state_dict = new_state_dict
                self.model.load_state_dict(state_dict)
                print("Model loaded successfully")
            else:
                print(f"Warning: Model file not found at {model_path}. Using randomly initialized weights.")
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            print("Using randomly initialized weights")
        
        self.model.eval()
        
        # Define image transformations
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
    
    def predict(self, image):
        """
        Predict the class of the input image and provide treatment information.
        
        Args:
            image (PIL.Image): Input image
            
        Returns:
            dict: Prediction results with class, confidence, and detailed treatment information
        """
        try:
            print("Starting image prediction...")
            print(f"Image mode: {image.mode}, size: {image.size}")
            
            # Preprocess the image
            try:
                img_tensor = self.transform(image).unsqueeze(0).to(self.device)
                print("Image transformed successfully")
            except Exception as e:
                print(f"Error transforming image: {str(e)}")
                raise
            
            # Make prediction
            try:
                with torch.no_grad():
                    print("Running model inference...")
                    outputs = self.model(img_tensor)
                    print("Model inference completed")
                    probabilities = F.softmax(outputs, dim=1)
                    confidence, predicted = torch.max(probabilities, 1)
                    confidence = confidence.item()
                    print(f"Predicted class index: {predicted.item()}, confidence: {confidence:.4f}")
            except Exception as e:
                print(f"Error during model inference: {str(e)}")
                raise
                
            # Get the predicted class and confidence
            try:
                predicted_class = self.classes[predicted.item()]
                print(f"Predicted class: {predicted_class}")
            except Exception as e:
                print(f"Error getting predicted class: {str(e)}")
                raise
            
            # Get detailed treatment information based on the predicted class
            treatment_info = self.treatment_info.get(predicted_class, {})
            
            # Prepare the response with detailed treatment information
            result = {
                'status': 'success',
                'prediction': {
                    'class': predicted_class,
                    'confidence': round(confidence, 4),
                    'description': treatment_info.get('description', ''),
                    'recommendations': treatment_info.get('recommendations', []),
                    'care_tips': treatment_info.get('care_tips', []),
                    'immediate_actions': treatment_info.get('immediate_actions', []),
                    'treatment_plan': treatment_info.get('treatment_plan', []),
                    'organic_solutions': treatment_info.get('organic_solutions', []),
                    'treatment_steps': treatment_info.get('treatment_steps', []),
                    'prevention': treatment_info.get('prevention', []),
                    'common_deficiencies': treatment_info.get('common_deficiencies', {}) if predicted_class == 'nutrient_deficiency' else None,
                    'general_advice': treatment_info.get('general_advice', [])
                }
            }
            
            # Add legacy 'advice' field for backward compatibility
            if predicted_class == 'healthy':
                result['prediction']['advice'] = treatment_info['description']
            elif predicted_class == 'diseased':
                result['prediction']['advice'] = treatment_info['description'] + ' ' + ' '.join(treatment_info.get('immediate_actions', []))
            elif predicted_class == 'pest_infested':
                result['prediction']['advice'] = treatment_info['description'] + ' ' + ' '.join(treatment_info.get('organic_solutions', []))
            elif predicted_class == 'nutrient_deficiency':
                result['prediction']['advice'] = treatment_info['description'] + ' Consider a soil test to identify specific deficiencies.'
            
            print(f"Prediction successful. Confidence: {confidence:.2%}")
            print(f"Prediction successful: {result}")
            return result
            
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Error during prediction: {str(e)}',
                'prediction': None
            }

# Singleton instance
pest_detector = None

def get_pest_detector(model_path=None):
    """Get or create the pest detector instance."""
    global pest_detector
    if pest_detector is None:
        pest_detector = PestDetectionModel(model_path=model_path)
    return pest_detector
