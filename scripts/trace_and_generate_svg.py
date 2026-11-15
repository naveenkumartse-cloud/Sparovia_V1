import math
import os
from PIL import Image

def run():
    img = Image.open('apps/admin/public/images/logo.png')
    crop_x0, crop_y0, crop_x1, crop_y1 = 80, 80, 635, 730
    mark = img.crop((crop_x0, crop_y0, crop_x1, crop_y1))
    w, h = mark.size
    alpha = mark.split()[3]

    def get_component_pixels(start_pixel, threshold=100):
        visited = set()
        q = [start_pixel]
        visited.add(start_pixel)
        while q:
            cx, cy = q.pop(0)
            for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]:
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                    if alpha.getpixel((nx, ny)) > threshold:
                        visited.add((nx, ny))
                        q.append((nx, ny))
        return visited

    comp0_pixels = get_component_pixels((276, 34))
    bottom_p = None
    for y in range(h-1, -1, -1):
        for x in range(w):
            if (x, y) not in comp0_pixels and alpha.getpixel((x, y)) > 128:
                bottom_p = (x, y)
                break
        if bottom_p:
            break
    comp1_pixels = get_component_pixels(bottom_p)

    def trace_contour(comp_set):
        sorted_pixels = sorted(list(comp_set), key=lambda p: (p[1], p[0]))
        start = sorted_pixels[0]
        dirs = [(0,-1), (1,-1), (1,0), (1,1), (0,1), (-1,1), (-1,0), (-1,-1)]
        contour = [start]
        current = start
        backtrack = 6
        while True:
            start_dir = (backtrack + 1) % 8
            found = False
            for i in range(8):
                d_idx = (start_dir + i) % 8
                dx, dy = dirs[d_idx]
                neighbor = (current[0] + dx, current[1] + dy)
                if neighbor in comp_set:
                    current = neighbor
                    contour.append(current)
                    backtrack = (d_idx + 4) % 8
                    found = True
                    break
            if not found or current == start:
                break
            if len(contour) > 5000:
                break
        return contour

    c0 = trace_contour(comp0_pixels)
    c1 = trace_contour(comp1_pixels)

    def point_line_dist(pt, line_start, line_end):
        dx = line_end[0] - line_start[0]
        dy = line_end[1] - line_start[1]
        if dx == 0 and dy == 0:
            return math.hypot(pt[0] - line_start[0], pt[1] - line_start[1])
        return abs(dy * pt[0] - dx * pt[1] + line_end[0] * line_start[1] - line_end[1] * line_start[0]) / math.hypot(dx, dy)

    def rdp(points, epsilon):
        if len(points) < 3:
            return points
        dmax = 0
        index = 0
        for i in range(1, len(points) - 1):
            d = point_line_dist(points[i], points[0], points[-1])
            if d > dmax:
                index = i
                dmax = d
        if dmax > epsilon:
            rec1 = rdp(points[:index+1], epsilon)
            rec2 = rdp(points[index:], epsilon)
            return rec1[:-1] + rec2
        else:
            return [points[0], points[-1]]

    s0 = rdp(c0, 1.2)
    s1 = rdp(c1, 1.2)

    overall_min_x = min(min(p[0] for p in s0), min(p[0] for p in s1))
    overall_min_y = min(min(p[1] for p in s0), min(p[1] for p in s1))

    shifted_s0 = [(round(p[0] - overall_min_x, 1), round(p[1] - overall_min_y, 1)) for p in s0]
    shifted_s1 = [(round(p[0] - overall_min_x, 1), round(p[1] - overall_min_y, 1)) for p in s1]

    d0 = 'M ' + ' L '.join(f'{x} {y}' for x, y in shifted_s0) + ' Z'
    d1 = 'M ' + ' L '.join(f'{x} {y}' for x, y in shifted_s1) + ' Z'

    max_x = max(max(p[0] for p in shifted_s0), max(p[0] for p in shifted_s1))
    max_y = max(max(p[1] for p in shifted_s0), max(p[1] for p in shifted_s1))

    print(f'Max X: {max_x}, Max Y: {max_y}')
    print('D0 vertices:', len(shifted_s0))
    print('D1 vertices:', len(shifted_s1))
    print('D0:', d0)
    print('D1:', d1)

if __name__ == '__main__':
    run()
