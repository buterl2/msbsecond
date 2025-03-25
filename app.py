from flask import Flask, render_template, jsonify
import json
import os
import time
from datetime import datetime

app = Flask(__name__)

# Store the last modification time of the JSON file
last_mod_time = 0

def get_statistics():
    global last_mod_time
    
    try:
        # Adjust this path to the location of your JSON file
        json_path = 'static/data/statistics_one_combine.json'
        
        if os.path.exists(json_path):
            # Check if file has been modified
            current_mod_time = os.path.getmtime(json_path)
            
            # Update the last_mod_time
            last_mod_time = current_mod_time
            
            with open(json_path, 'r') as file:
                data = json.load(file)
                
            # Get today's date in YYYY-MM-DD format
            today = datetime.now().strftime('%Y-%m-%d')
            
            # Find data for today's date
            today_data = None
            for date_entry in data.get('by_date', []):
                if date_entry.get('date') == today:
                    today_data = date_entry
                    break
            
            return {
                'success': True,
                'data': data,
                'today_data': today_data,
                'today': today,
                'last_modified': datetime.fromtimestamp(current_mod_time).strftime('%Y-%m-%d %H:%M:%S')
            }
        else:
            return {
                'success': False,
                'error': 'Statistics file not found',
                'today': datetime.now().strftime('%Y-%m-%d')
            }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'today': datetime.now().strftime('%Y-%m-%d')
        }

# Add to your app.py file

def get_ltap_statistics():
    try:
        # Adjust this path to the location of your JSON file
        json_path = 'static/data/statistics_ltap.json'
        
        if os.path.exists(json_path):
            current_mod_time = os.path.getmtime(json_path)
            
            with open(json_path, 'r') as file:
                data = json.load(file)
                
            return {
                'success': True,
                'data': data,
                'last_modified': datetime.fromtimestamp(current_mod_time).strftime('%Y-%m-%d %H:%M:%S')
            }
        else:
            return {
                'success': False,
                'error': 'LTAP statistics file not found'
            }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

@app.route('/api/ltap_statistics')
def ltap_statistics():
    return jsonify(get_ltap_statistics())

@app.route('/heatmap')
def heatmap():
    """Render the heatmap page"""
    return render_template('heatmap.html')

@app.route('/api/bin_locations')
def bin_locations():
    """API endpoint to get bin location data"""
    try:
        # Path to the JSON file
        json_path = 'static/data/bin_locations.json'
        
        if os.path.exists(json_path):
            current_mod_time = os.path.getmtime(json_path)
            
            with open(json_path, 'r') as file:
                data = json.load(file)
                
            return jsonify({
                'success': True,
                'layout': data['layout'],
                'last_modified': datetime.fromtimestamp(current_mod_time).strftime('%Y-%m-%d %H:%M:%S')
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Bin locations file not found'
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# Function to generate bin locations in range
def generate_bin_range(start_bin, end_bin, column=1):
    """Generate a range of bin locations between start and end"""
    # This is a helper function you can use later to generate bin ranges
    bins = []
    
    # Get the letter prefix and numeric part of the bins
    prefix_start = ''.join(filter(str.isalpha, start_bin))
    prefix_end = ''.join(filter(str.isalpha, end_bin))
    
    if prefix_start != prefix_end:
        # If prefixes don't match, we can't generate a range
        return bins
    
    num_start = int(''.join(filter(str.isdigit, start_bin)))
    num_end = int(''.join(filter(str.isdigit, end_bin)))
    
    # Generate bins in the range
    for num in range(num_start, num_end + 1):
        bin_id = f"{prefix_start}{num:04d}"
        bins.append({
            "location": bin_id,
            "column": column,
            "status": "active"
        })
    
    return bins

@app.route('/api/cdhdr_statistics')
def cdhdr_statistics():
    try:
        # Adjust this path to the location of your JSON file
        json_path = 'static/data/statistics_cdhdr.json'
        
        if os.path.exists(json_path):
            current_mod_time = os.path.getmtime(json_path)
            
            with open(json_path, 'r') as file:
                data = json.load(file)
                
            return jsonify({
                'success': True,
                'data': data,
                'last_modified': datetime.fromtimestamp(current_mod_time).strftime('%Y-%m-%d %H:%M:%S')
            })
        else:
            return jsonify({
                'success': False,
                'error': 'CDHDR statistics file not found'
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/zu_history_statistics')
def zu_history_statistics():
    try:
        # Adjust this path to the location of your JSON file
        json_path = 'static/data/statistics_zu_history.json'
        
        if os.path.exists(json_path):
            current_mod_time = os.path.getmtime(json_path)
            
            with open(json_path, 'r') as file:
                data = json.load(file)
                
            return jsonify({
                'success': True,
                'data': data,
                'last_modified': datetime.fromtimestamp(current_mod_time).strftime('%Y-%m-%d %H:%M:%S')
            })
        else:
            return jsonify({
                'success': False,
                'error': 'ZU History statistics file not found'
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/statistics')
def statistics():
    return jsonify(get_statistics())

# Add this new route to your app.py file
@app.route('/conveyor')
def conveyor():
    return render_template('conveyor.html')

@app.route('/api/pgid_lines_statistics')
def pgid_lines_statistics():
    try:
        # Adjust this path to the location of your JSON file
        json_path = 'static/data/statistics_pgid_lines.json'
        
        if os.path.exists(json_path):
            current_mod_time = os.path.getmtime(json_path)
            
            with open(json_path, 'r') as file:
                data = json.load(file)
                
            return jsonify({
                'success': True,
                'data': data,
                'last_modified': datetime.fromtimestamp(current_mod_time).strftime('%Y-%m-%d %H:%M:%S')
            })
        else:
            return jsonify({
                'success': False,
                'error': 'PGID Lines statistics file not found'
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port, debug=False)