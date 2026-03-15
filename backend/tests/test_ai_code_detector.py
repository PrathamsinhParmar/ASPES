import pytest
from unittest.mock import patch, MagicMock
import ast
import textwrap

from app.ai_engine.ai_code_detector import AICodeDetector

# --- Fixtures ---

@pytest.fixture
def detector():
    """Returns a fresh instance of AICodeDetector."""
    return AICodeDetector()

@pytest.fixture
def human_code_sample():
    """A realistic, slightly messy human-written code sample."""
    return textwrap.dedent("""
        def calculate_total(items, discount=0):
            # calc total price
            total = 0
            for i in items:
                total += i.price
            
            if discount > 0:
                total = total - (total * discount / 100)
            return total
            
        class ShoppingCart:
            def __init__(self):
                self.items = []
                
            def add_item(self, item):
                self.items.append(item)
                
            def checkout(self):
                # process the order now
                print("Checking out...")
                return calculate_total(self.items)
    """)

@pytest.fixture
def ai_code_sample():
    """A very structured, heavily documented AI-like code sample."""
    return textwrap.dedent("""
        def calculate_aggregate_total_with_applicable_discount(item_collection_list, discount_percentage_rate=0):
            \"\"\"
            Calculates the aggregate total of items with an optional discount.
            
            Args:
                item_collection_list: List of items to process.
                discount_percentage_rate: Discount to apply.
            \"\"\"
            # Initialize the aggregate total accumulator variable
            aggregate_total_accumulator_variable = 0
            
            # Iterate through each item in the provided item collection list
            for current_item_instance in item_collection_list:
                aggregate_total_accumulator_variable += current_item_instance.price
                
            # Apply the discount if the discount percentage rate is greater than zero
            if discount_percentage_rate > 0:
                aggregate_total_accumulator_variable -= (aggregate_total_accumulator_variable * discount_percentage_rate / 100)
                
            return aggregate_total_accumulator_variable
            
        class OptimizedShoppingCartContainerClass:
            \"\"\"
            A container class representing a shopping cart instance.
            \"\"\"
            def __init__(self):
                \"\"\"Initializes the shopping cart with an empty item list.\"\"\"
                self.shopping_cart_item_collection_list = []
                
            def add_new_item_to_shopping_cart_collection(self, new_item_instance_to_add):
                \"\"\"Adds a new item to the shopping cart collection list.\"\"\"
                self.shopping_cart_item_collection_list.append(new_item_instance_to_add)
                
            def process_checkout_for_current_shopping_cart(self):
                \"\"\"Processes the checkout for the current shopping cart instance.\"\"\"
                # Print the checkout initialization message to the console
                print("Checking out...")
                return calculate_aggregate_total_with_applicable_discount(self.shopping_cart_item_collection_list)
    """)

# --- Unit Tests ---

def test_empty_code(detector):
    """Test handling of empty or whitespace-only inputs."""
    result = detector.analyze("")
    assert result["verdict"] == "UNCERTAIN"
    assert result["ai_generated_probability"] == 0.0
    assert "Empty code" in result.get("error", "")
    
    result_whitespace = detector.analyze("   \\n  \\t  ")
    assert result_whitespace["verdict"] == "UNCERTAIN"

def test_check_perfect_comments(detector):
    """Test pattern: AI comments often start with capital letters and lack terminal punctuation."""
    ai_comments = "# This is a perfect comment format\\n# Another perfect one here"
    human_comments = "# this is a messy comment\\n# another bad one"
    
    assert detector._check_perfect_comments(ai_comments) is True
    assert detector._check_perfect_comments(human_comments) is False

def test_check_verbose_names(detector, ai_code_sample, human_code_sample):
    """Test pattern: finding overly long variables/functions > 15 chars."""
    assert detector._check_verbose_names(ai_code_sample) is True
    assert detector._check_verbose_names(human_code_sample) is False

def test_docstring_coverage(detector, ai_code_sample, human_code_sample):
    """Test calculation of docstring coverage ratio."""
    ai_coverage = detector._docstring_coverage(ai_code_sample)
    human_coverage = detector._docstring_coverage(human_code_sample)
    
    assert ai_coverage > 0.90  # AI code is 100% documented here
    assert human_coverage < 0.50 # Human code is 0% documented here

def test_style_consistency_check(detector):
    """Test consistency of quotes and spacing."""
    # Highly consistent (AI)
    consistent_code = "a_var = 1\\nb_var = 2\\nc_var = 3\\nmsg1_var = 'hello'\\nmsg2_var = 'world'"
    inconsistent_code = 'a_var=1\\nb_var = 2\\nc_var= 3\\nmsg1_var = "hello"\\nmsg2_var = "world"'
    
    consistent_score = detector._style_consistency_check(consistent_code)
    inconsistent_score = detector._style_consistency_check(inconsistent_code)
    
    assert consistent_score >= inconsistent_score

# --- Mocking and ML Tests ---

@patch("app.ai_engine.ai_code_detector._get_ml_model")
def test_ml_detection_fallback(mock_get_model, detector, human_code_sample):
    """Test that when ML model fails to load, the system falls back safely."""
    # Mock ML model returning None (unavailable)
    mock_get_model.return_value = (None, None)
    
    ml_score = detector._ml_detection(human_code_sample)
    assert ml_score == 0.5  # Neutral fallback score

@patch("app.ai_engine.ai_code_detector._get_ml_model")
def test_ml_detection_success(mock_get_model, detector):
    """Test ML detection behaving normally."""
    import sys
    
    mock_model = MagicMock()
    mock_tokenizer = MagicMock()
    
    mock_logits = MagicMock()
    mock_logits.logits = MagicMock()
    mock_model.return_value = mock_logits
    
    # Mock the torch module entirely
    mock_torch = MagicMock()
    mock_torch.no_grad = MagicMock()
    # Simulate torch tensor [label 0 prob, label 1 prob (AI)]
    mock_prob_tensor = MagicMock()
    mock_prob_tensor.item.return_value = 0.9
    mock_tensor_array = [[MagicMock(), mock_prob_tensor]]
    mock_torch.softmax.return_value = mock_tensor_array
    
    with patch.dict(sys.modules, {'torch': mock_torch}):
        mock_get_model.return_value = (mock_tokenizer, mock_model)
        
        # Test evaluation
        ml_score = detector._ml_detection("print('hello')")
        assert ml_score == 0.9 # Should extract the AI probability

# --- Integration / Full Analysis Tests ---

@patch("app.ai_engine.ai_code_detector.AICodeDetector._ml_detection")
def test_analyze_human_code(mock_ml, detector, human_code_sample):
    """Integration: Test full analysis pipeline against human code."""
    mock_ml.return_value = 0.2  # Simulate ML identifying human code
    
    result = detector.analyze(human_code_sample)
    
    assert result["ai_generated_probability"] < 0.5
    assert result["verdict"] in ["LIKELY_HUMAN", "POSSIBLY_HUMAN", "UNCERTAIN"]
    assert "ml_detection" in result["detection_details"]

@patch("app.ai_engine.ai_code_detector.AICodeDetector._ml_detection")
def test_analyze_ai_code(mock_ml, detector, ai_code_sample):
    """Integration: Test full analysis pipeline against highly suspect AI code."""
    mock_ml.return_value = 0.85  # Simulate ML identifying AI code
    
    result = detector.analyze(ai_code_sample)
    
    assert result["ai_generated_probability"] > 0.60
    assert result["verdict"] in ["LIKELY_AI_GENERATED", "POSSIBLY_AI_ASSISTED"]
    
    # Assert flags are triggered
    flags = result["flags"]
    assert len(flags) > 0
    assert any("verbose" in flag.lower() for flag in flags)

def test_calculate_confidence(detector):
    """Test that wide variation in metrics produces low confidence."""
    # Strong agreement -> high confidence
    high_conf = detector._calculate_confidence({"ml": 0.9, "pattern": 0.85, "style": 0.9})
    # Strong disagreement -> low confidence
    low_conf = detector._calculate_confidence({"ml": 0.9, "pattern": 0.1, "style": 0.5})
    
    assert high_conf > low_conf
