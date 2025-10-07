from PIL import Image, ImageOps
import numpy as np

def preprocess_image(image, target_size=(224, 224)):
    """
    Preprocess the image for model inference.
    
    Args:
        image: PIL Image or file-like object
        target_size: Target size for resizing (width, height)
        
    Returns:
        PIL Image: Preprocessed image
    """
    try:
        if not isinstance(image, Image.Image):
            image = Image.open(image).convert('RGB')
            
        # Resize and maintain aspect ratio
        image = ImageOps.fit(image, target_size, Image.Resampling.LANCZOS)
        
        # Enhance image quality
        image = image.convert('RGB')
        
        return image
        
    except Exception as e:
        raise ValueError(f"Error preprocessing image: {str(e)}")

def is_leaf_image(image, green_threshold=0.15, edge_threshold=0.01):
    """
    Enhanced check if the image contains a plant leaf.
    
    Args:
        image: PIL Image
        green_threshold: Minimum percentage of green pixels required
        edge_threshold: Minimum edge density required for leaf-like texture
        
    Returns:
        tuple: (is_leaf: bool, message: str)
    """
    try:
        if not image or not hasattr(image, 'size'):
            return False, "Invalid image"
            
        # Convert to RGB if not already
        if image.mode != 'RGB':
            try:
                image = image.convert('RGB')
            except:
                return False, "Unsupported image format"
        
        # Check image size
        if min(image.size) < 50:  # Too small to be a proper leaf image
            return False, "Image is too small. Please upload a clearer image."
        
        # Convert to numpy array
        img_array = np.array(image)
        if img_array.size == 0:
            return False, "Empty image"
        
        # Calculate color distribution
        r, g, b = img_array[..., 0], img_array[..., 1], img_array[..., 2]
        
        # Check for green dominance
        green_pixels = (g > r * 1.1) & (g > b * 1.1) & (g > 20)
        green_ratio = np.mean(green_pixels)
        
        # Check for typical leaf colors (green, yellow, brown)
        hsv_img = np.array(image.convert('HSV'))
        h, s, v = hsv_img[..., 0], hsv_img[..., 1], hsv_img[..., 2]
        
        # Hue ranges for green (30-90), yellow (15-30), brown (10-25 with low value)
        is_green = ((h > 30) & (h < 90) & (s > 40) & (v > 30)).mean()
        is_yellow = ((h > 15) & (h < 30) & (s > 40) & (v > 50)).mean()
        is_brown = ((h > 10) & (h < 25) & (s > 40) & (v < 70) & (v > 20)).mean()
        
        leaf_color_ratio = is_green + is_yellow + is_brown
        
        # Simple edge detection for texture
        gray = np.array(image.convert('L'))
        edges = np.abs(np.gradient(gray.astype(float))).sum() / (255 * gray.size)
        
        # Decision logic
        is_leaf = (green_ratio > green_threshold or leaf_color_ratio > 0.2) and edges > edge_threshold
        
        if not is_leaf:
            if green_ratio <= green_threshold and leaf_color_ratio <= 0.2:
                return False, "The image doesn't appear to contain plant leaves. Please upload an image of a plant leaf."
            if edges <= edge_threshold:
                return False, "The image lacks sufficient detail. Please upload a clearer image of a plant leaf."
                
        return True, "Valid leaf image"
        
    except Exception as e:
        return False, f"Error processing image: {str(e)}. Please try again with a different image."
