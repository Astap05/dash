from google import genai
from google.genai import types
import base64
import os

def generate():
  client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)

  msg1_image1 = types.Part.from_uri(
      file_uri="gs://qwiklabs-gcp-02-60f4749fd21b-bucket/cymbal-product-image.png",
      mime_type="image/png",
  )
  msg1_text1 = types.Part.from_text(text="""Short, descriptive text inspired by the image.
Catchy phrases suitable for advertisements.
A poetic description for a nature-focused campaign.""")
  msg2_text1 = types.Part.from_text(text="""**Examining Image Details**

I'm currently focused on the image itself. My goal is to extract the key visual elements to inform the three description types requested. I've started noting down prominent features that will be crucial for the descriptive text, catchphrases, and the poetic nature-based campaign.


**Crafting Descriptive Elements**

I'm now prioritizing the construction of the three description types. I'm leveraging the identified image elements – the trail, wildflowers, gear, and mountain backdrop – to form the short descriptive text, generate advertising catchphrases, and compose the poetic campaign content. I'm focusing on concise, impactful wording for each.""")
  msg2_text2 = types.Part.from_text(text="""Here are some descriptions inspired by the image:

**Short, descriptive text inspired by the image:**
A vibrant mountain trail winds through a lush meadow bursting with colorful wildflowers. A blue hiking backpack rests beside the path, a map spread open nearby, inviting exploration of the serene natural landscape.

**Catchy phrases suitable for advertisements:**
*   Discover Your Next Adventure.
*   Where Wildflowers Meet Wild Trails.
*   Explore More. Worry Less.
*   Your Path to Natural Beauty.
*   Unfold Your Journey.

**A poetic description for a nature-focused campaign:**
Amidst the emerald slopes where whispers of wind play,
A painter's palette of blossoms lights the way.
Bluebells dance with daffodils, a crimson fiery grace,
Along a winding ribbon, through nature's soft embrace.
Here lies a journey's promise, a map to guide your stride,
With sturdy pack beside you, where wonders softly hide.
Breathe deep the mountain's magic, let spirit take its flight,
In this sun-drenched sanctuary, bathed in golden light.""")
  msg4_text1 = types.Part.from_text(text="""**Analyzing Advertisement Phrases**

I'm now zeroing in on brevity. The goal is to craft punchy phrases. I'm prioritizing positive language to draw people in, making sure the message is not just brief but also appealing, like a well-crafted hook.""")
  msg4_text2 = types.Part.from_text(text="""Here are some revised catchy phrases, focusing on being bright and short:

**Catchy phrases suitable for advertisements:**
*   Trail Bliss.
*   Nature's Canvas.
*   Adventure Awaits.
*   Bloom & Explore.
*   Find Your Path.""")
  msg5_text1 = types.Part.from_text(text="""Short, descriptive text inspired by the image.
Catchy phrases suitable for advertisements,catchy phrases should be bright and short.
A poetic description for a nature-focused campaign.Must contain the word "egor" ! """)

  model = "gemini-2.5-flash"
  contents = [
    types.Content(
      role="user",
      parts=[
        msg1_image1,
        msg1_text1
      ]
    ),
    types.Content(
      role="model",
      parts=[
        msg2_text1,
        msg2_text2
      ]
    ),
    types.Content(
      role="user",
      parts=[
        types.Part.from_text(text="""catchy phrases should be bright and short""")
      ]
    ),
    types.Content(
      role="model",
      parts=[
        msg4_text1,
        msg4_text2
      ]
    ),
    types.Content(
      role="user",
      parts=[
        msg5_text1
      ]
    ),
  ]
  tools = [
    types.Tool(google_search=types.GoogleSearch()),
  ]

  generate_content_config = types.GenerateContentConfig(
    temperature = 0.2,
    top_p = 0.48,
    max_output_tokens = 779,
    safety_settings = [types.SafetySetting(
      category="HARM_CATEGORY_HATE_SPEECH",
      threshold="OFF"
    ),types.SafetySetting(
      category="HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold="OFF"
    ),types.SafetySetting(
      category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold="OFF"
    ),types.SafetySetting(
      category="HARM_CATEGORY_HARASSMENT",
      threshold="OFF"
    )],
    tools = tools,
    thinking_config=types.ThinkingConfig(
      thinking_budget=-1,
    ),
  )

  for chunk in client.models.generate_content_stream(
    model = model,
    contents = contents,
    config = generate_content_config,
    ):
    if not chunk.candidates or not chunk.candidates[0].content or not chunk.candidates[0].content.parts:
        continue
    print(chunk.text, end="")

generate()