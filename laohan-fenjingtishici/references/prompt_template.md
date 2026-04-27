# Gemini 分镜提示词模板

> 此文件为 /laohan-fenjingtishici 的参考资源，包含完整的 Gemini 提示词模板。
> 使用时替换 {VIDEO_LENGTH}、{FRAME_COUNT}、{PRODUCT_DESCRIPTION} 三个变量。

---

I uploaded a short product promotional video. Break it down into storyboard frames and generate a professional image generation prompt for each frame.

## Key constraint: 5-second segments

Each frame will become a 5-second video segment (AI video generator limitation). Therefore:
- Count the video length and divide by 5 to determine the exact number of frames.
- REMAINDER RULE: If the video length is not a perfect multiple of 5 (e.g., 32 seconds), round up to the next 5-second interval (e.g., 35 seconds = 7 frames). Treat the final remaining seconds as a full 5-second segment. Do not compress or rush multiple actions into it; describe it with normal 5-second pacing (the creator will trim the excess length in post-production).
- Timestamps MUST strictly follow a 5-second mathematical progression without exception (0:00-0:05, 0:05-0:10, 0:10-0:15, etc.).
- Each frame should capture ONE key action or moment (single-beat rule) — do not overload a frame with multiple actions.
- The sequence of frames must tell a complete product story when played back as 5-second clips.

## Requirements

1. Identify the key scenes — one per 5-second segment — that together tell a complete product story.
2. Prompts must be pure visual descriptions optimized for diffusion models (FLUX/SDXL). Do not include conversational filler (e.g. "Generate an image of..."). Resolution is controlled by the tool, not the prompt.
3. Camera language must use professional cinematography terms:
   - Shot sizes: extreme close-up, close-up, medium close-up, medium shot, full shot, wide shot
   - Angles: bird's-eye, high-angle, eye-level, low-angle, dutch angle
   - Depth of field: specify f-stop equivalent (f/1.4 = very shallow, f/8 = deep)
   - Composition: rule-of-thirds, centered, radial balance, leading lines
4. Lighting and Environment rules:
   - Extract the LIGHTING DIRECTION and TECHNIQUE from the reference video, but FORCE the overall aesthetic to be "real commercial photography style".
   - Completely strip away any overly CG-style glowing effects, cheap neon lights, or hyper-specific backgrounds from the reference video unless explicitly requested. Replace the background with a clean, premium, high-end commercial setting that matches the lighting.
   - SCENE CONSISTENCY: The [SCENE] description MUST be strictly identical across ALL frames (e.g., pick one premium setting like "minimalist dark slate surface" and use it for every single frame). Do not change backgrounds between shots. Only camera angles and lighting angles can change.
5. Explicitly separate Positive Prompt and Negative Prompt so they can be directly copy-pasted into separate workflow nodes.
6. Product/Subject rules:
   - Use [PRODUCT] as a placeholder for the main product in all prompts. Do NOT describe the specific product from the reference video. The product appearance will be provided separately via a reference image during image generation. Extract only the STRUCTURE from the reference video: camera angles, actions, scene layout, lighting — not the product's visual details.
   - Action Adaptation (CRITICAL): Eradicate any highly specific, product-locked interactions from the reference video (e.g., fitting a silicone sleeve, threading a lanyard, inserting an earbud). ADAPT these into universally applicable, premium commercial interactions (e.g., "hands carefully adjusting the outer textures", "unveiling complementary elements", "arranging items gracefully", "presenting side-by-side").
   - Consistency: The [PRODUCT] placeholder MUST appear in every frame where the product is visible.
   - Dynamic Posing: Since these images will seed an Image-to-Video model, describe subjects mid-action or in dynamic postures to imply impending movement (e.g., "reaching out", "mid-stride", "leaning forward"). Avoid purely static poses.
7. Each frame should show the product from a different angle/perspective and serve a clear storytelling purpose in the sequence.

## Output Format

Output each frame strictly as:

---
Frame 1 [timestamp - storytelling purpose]:
**Positive Prompt:**
[SCENE] <Environment, background, atmosphere - strictly identical in all frames, ensuring real commercial photography style without CG glow>, [SUBJECT] <Product/person visual details: dynamic pose mid-action, position, using [PRODUCT] placeholder>, [CAMERA] <Shot size, angle, depth of field, focal length, composition>, [LIGHTING] <Light source, direction, color temperature, shadow quality, technique>, [STYLE] <Real commercial photography, premium aesthetic, quality markers>

**Negative Prompt:**
<3-5 specific visual elements, objects, or errors to prevent, comma-separated, including "CG, glowing effects, over-saturation">
---

Frame 2 [timestamp - storytelling purpose]:
**Positive Prompt:**
[Full structured prompt]

**Negative Prompt:**
<negatives>
---

...and so on for all frames.
