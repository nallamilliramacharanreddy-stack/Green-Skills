import math
import random

def generate_svg():
    width = 1200
    height = 30
    
    path = f"M0,{height} "
    
    # Generate points
    # We want a jagged, somewhat random organic line between y=5 and y=25
    x = 0
    y = 15
    while x <= width:
        path += f"L{x},{y} "
        
        # Move forward by a small random step (1 to 5 pixels) for high detail
        x += random.uniform(2, 6)
        
        # The y position wanders randomly but stays bounded
        y += random.uniform(-4, 4)
        if y < 5: y = 5
        if y > 25: y = 25
        
    path += f"L{width},{y} "
    path += f"L{width},{height} Z"
    
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" preserveAspectRatio="none">
    <path d="{path}" fill="currentColor" />
</svg>'''
    
    with open("./client/src/assets/torn-edge.svg", "w") as f:
        f.write(svg)

generate_svg()
