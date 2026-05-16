let model = null;
let classIndices = null;

// Load model and class indices
async function loadModelAndData() {
    try {
        // Make sure the path to model.json is correct
        const modelPromise = await tf.loadGraphModel('./model3/model.json');
        
        // For class indices - check if file exists in correct location
        const classIndicesPromise = fetch('./class_indices.json')
            .then(res => res.json())
            .catch(err => {
                console.log('Class indices not found, using default mapping');
                return {
                    "0": "glioma_tumor", 
                    "1": "no_tumor", 
                    "2": "meningioma_tumor", 
                    "3": "pituitary_tumor"
                };
            });
        
        const [loadedModel, loadedClassIndices] = await Promise.all([modelPromise, classIndicesPromise]);
        
        model = loadedModel;
        classIndices = loadedClassIndices;
        
        console.log('Model and class indices loaded successfully');
        console.log('Class indices:', classIndices);
        
        // Enable upload button
        document.querySelector('.file-label').style.opacity = 1;
        document.querySelector('.file-label').style.pointerEvents = 'auto';
        
        return true;
    } catch (error) {
        console.error('Error loading model or class indices:', error);
        document.getElementById('error-message').textContent = 
            'Failed to load brain tumor detection model. Please try again later. Error: ' + error.message;
        document.getElementById('error-message').style.display = 'block';
        
        // Add more detailed logging
        console.error('Detailed error information:', error);
        if (error.stack) console.error('Stack trace:', error.stack);
        
        // Disable upload button
        document.querySelector('.file-label').style.opacity = 0.5;
        document.querySelector('.file-label').style.pointerEvents = 'none';
        
        return false;
    }
}

function preprocessImage(image) {
    return tf.tidy(() => {
        // Convert image to tensor from <img> (RGB by default in tf.js)
        let tensor = tf.browser.fromPixels(image);

        // Resize to 150x150
        tensor = tf.image.resizeBilinear(tensor, [150, 150]);

        // Do NOT normalize if Python also doesn't normalize
        // Just convert to float32
        tensor = tensor.toFloat();

        // Add batch dimension (1, 150, 150, 3)
        return tensor.expandDims(0);
    });
}



// Predict function for multi-class prediction
async function predictTumor(imageTensor) {
    try {
        // Make prediction
        const predictions = model.predict(imageTensor);
        const predictionData = await predictions.data();
        
        // Find index of highest probability
        let maxProbIndex = 0;
        let maxProb = predictionData[0];
        
        for (let i = 1; i < predictionData.length; i++) {
            if (predictionData[i] > maxProb) {
                maxProb = predictionData[i];
                maxProbIndex = i;
            }
        }
        
        // Get class name from index
        const predictedClass = classIndices[maxProbIndex.toString()];
        
        // Return prediction results
        return {
            predictedClass,
            confidence: maxProb * 100, // Convert to percentage
            allProbabilities: predictionData.map(p => p * 100), // All probabilities as percentages
            hasTumor: predictedClass !== "no_tumor" // Boolean flag for tumor presence
        };
    } catch (error) {
        console.error('Prediction error:', error);
        throw error;
    }
}

// Function to get color based on tumor type
function getTumorColor(tumorType) {
    const colors = {
        "glioma_tumor": "#e74c3c",      // Red
        "meningioma_tumor": "#f39c12",  // Orange
        "pituitary_tumor": "#9b59b6",   // Purple
        "no_tumor": "#2ecc71"           // Green
    };
    
    return colors[tumorType] || "#e74c3c";
}

// Get tumor display name
function getTumorDisplayName(tumorType) {
    const displayNames = {
        "glioma_tumor": "Glioma Tumor",
        "meningioma_tumor": "Meningioma Tumor",
        "pituitary_tumor": "Pituitary Tumor",
        "no_tumor": "No Tumor Detected"
    };
    
    return displayNames[tumorType] || tumorType;
}

// Get recommendations based on tumor type
function getRecommendation(tumorType) {
    const recommendations = {
        "glioma_tumor": "Recommendation: Urgent consultation with a neurologist and neurosurgeon is advised. Additional imaging and possibly a biopsy may be necessary.",
        "meningioma_tumor": "Recommendation: Consultation with a neurosurgeon is advised. Most meningiomas are benign but may require monitoring or surgical intervention depending on size and location.",
        "pituitary_tumor": "Recommendation: Consult with an endocrinologist and neurosurgeon. Additional hormonal testing is recommended as pituitary tumors can affect hormone production.",
        "no_tumor": "Recommendation: No abnormalities detected. Continue with routine follow-up as advised by your doctor."
    };
    
    return recommendations[tumorType] || "Recommendation: Please consult with a healthcare professional for proper evaluation.";
}

// Initialize on document load
document.addEventListener('DOMContentLoaded', () => {
    const uploadInput = document.getElementById('image-upload');
    const previewImg = document.getElementById('preview-img');
    const placeholderText = document.getElementById('placeholder-text');
    const initialMessage = document.getElementById('initial-message');
    const predictionContainer = document.getElementById('prediction-container');
    const predictionText = document.getElementById('prediction-text');
    const resultIcon = document.getElementById('result-icon');
    const confidenceBar = document.getElementById('confidence-bar');
    const predictionConfidence = document.getElementById('prediction-confidence');
    const predictionRecommendation = document.getElementById('prediction-recommendation');
    const errorMessage = document.getElementById('error-message');
    const loadingSpinner = document.getElementById('loading-spinner');
    const probabilityContainer = document.getElementById('probability-container');

    // Disable upload button until model loads
    document.querySelector('.file-label').style.opacity = 0.5;
    document.querySelector('.file-label').style.pointerEvents = 'none';
    
    // Load model
    loadModelAndData();
    
    // Handle file upload
    uploadInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Reset previous state
        previewImg.style.display = 'none';
        placeholderText.style.display = 'none';
        predictionContainer.style.display = 'none';
        initialMessage.style.display = 'none';
        errorMessage.style.display = 'none';
        loadingSpinner.style.display = 'block';
        
        // Clear previous probability bars
        if (probabilityContainer) {
            probabilityContainer.innerHTML = '';
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
                previewImg.src = e.target.result;
                previewImg.style.display = 'block';
                loadingSpinner.style.display = 'none';

                try {
                    // Check if model is loaded
                    if (!model) {
                        throw new Error('Model not loaded yet');
                    }

                    // Process image and make prediction
                    const imageTensor = preprocessImage(img);
                    const result = await predictTumor(imageTensor);

                    // Update UI with results
                    const tumorType = result.predictedClass;
                    const isTumor = result.hasTumor;
                    
                    predictionText.textContent = getTumorDisplayName(tumorType);
                    predictionText.className = isTumor ? 'tumor-detected' : 'no-tumor';
                    
                    // Set appropriate icon based on result
                    if (isTumor) {
                        resultIcon.className = 'fas fa-exclamation-triangle result-icon tumor-detected';
                    } else {
                        resultIcon.className = 'fas fa-circle-check result-icon no-tumor';
                    }
                    
                    // Update confidence bar for primary prediction
                    confidenceBar.style.width = `${result.confidence}%`;
                    confidenceBar.style.backgroundColor = getTumorColor(tumorType);
                    predictionConfidence.textContent = `Confidence: ${result.confidence.toFixed(2)}%`;
                    
                    // Add recommendation based on result
                    predictionRecommendation.textContent = getRecommendation(tumorType);
                    
                    // Create probability bars for all classes
                    if (probabilityContainer && result.allProbabilities) {
                        const classes = Object.values(classIndices);
                        classes.forEach((className, index) => {
                            const probability = result.allProbabilities[index];
                            
                            // Create elements for this class
                            const classDiv = document.createElement('div');
                            classDiv.className = 'probability-row';
                            
                            const classLabel = document.createElement('div');
                            classLabel.className = 'probability-label';
                            classLabel.textContent = getTumorDisplayName(className);
                            
                            const barContainer = document.createElement('div');
                            barContainer.className = 'probability-bar-container';
                            
                            const bar = document.createElement('div');
                            bar.className = 'probability-bar';
                            bar.style.width = `${probability}%`;
                            bar.style.backgroundColor = getTumorColor(className);
                            
                            const percentText = document.createElement('span');
                            percentText.className = 'probability-percent';
                            percentText.textContent = `${probability.toFixed(1)}%`;
                            
                            // Assemble and append
                            barContainer.appendChild(bar);
                            classDiv.appendChild(classLabel);
                            classDiv.appendChild(barContainer);
                            classDiv.appendChild(percentText);
                            
                            probabilityContainer.appendChild(classDiv);
                        });
                    }
                    
                    predictionContainer.style.display = 'flex';
                    
                    // Clean up tensor
                    imageTensor.dispose();
                } catch (predError) {
                    console.error('Prediction error:', predError);
                    errorMessage.textContent = 'Error analyzing image. Please try a different scan.';
                    errorMessage.style.display = 'block';
                    initialMessage.style.display = 'block';
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
});
window.onload = function () {
    const container = document.getElementById("prediction-container");
    if (container) container.scrollTop = 0;
  };