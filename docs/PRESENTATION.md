# A three-minute Moodrobe demonstration

## Before the conversation

Use a clean browser or restore your own backup. Add five real wardrobe photographs for a personal demonstration. Use only photos you own or have permission to use. Click **Create with local AI** once beforehand so the model can load on the device. Keep an offline-independent fallback plan: a network connection is needed on first use, and device performance varies.

## 0:00–0:30 / The question

“I started with a familiar situation: having plenty of clothes and still not knowing what to wear. Moodrobe asks whether a brief personal check-in and better visibility into an existing wardrobe can help people make a choice and rediscover overlooked pieces.”

Explain which research, interviews and decisions you personally completed. Do not turn the literature or the case study's proposed pilot into claims of work already performed.

## 0:30–1:15 / The working experience

Show the photographic wardrobe. Choose a check-in, then write a specific brief such as “A formal presentation on campus, followed by dinner with friends. Polished but comfortable.” Run the local model, open a neural edit, inspect the individual pieces and save it. Plan a date or log a wear; show the diary after reloading.

“These are my wardrobe items, not shopping recommendations. The images make the output tangible. The sample photographs are AI-generated and clearly labelled; my own uploads are kept on this device.”

## 1:15–2:00 / Explain the AI accurately

Open **Inside the AI**. Point to the actual number of candidates, model dimensions and local training examples.

“The pretrained sentence encoder represents the brief and garment descriptions as vectors. The outfit assembler enforces completeness. The neural similarity score contributes to ranking, while a small preference head is trained locally on accepted and rejected outfit vectors. I did not pretrain the encoder. This implementation was developed with AI-assisted engineering.”

Vote “That’s me” or “Not today”, refresh the neural edit, and show that a preference training example and training loss now exist. Explain that training loss is not held-out accuracy. A handful of examples does not establish good personalisation.

## 2:00–2:30 / The ethical product choice

Open **Wear it again**. Find an item unused for at least 60 days. Anchor a neural edit to that piece, or show the external reuse choices.

“The main flow does not encourage new purchases. We count real wear actions and do not invent carbon savings. Shopping-related editorial advice is only available when the user explicitly requests it.”

## 2:30–3:00 / What evidence would change the idea?

Show the local blind comparison and describe the proposed 15–20 person pilot. Explain its limits: the app's A/B collection interface is not a controlled trial, and no pilot results have been claimed.

“The open question is whether people prefer these suggestions and actually wear more of the wardrobe they already have. If the evidence does not support that, the idea should change.”

## Claims to avoid

- “I trained a foundation model” or “I built all the code independently”, unless you really did.
- “It reads your emotion from your face, voice or heartbeat.” It does not.
- “The model understands fashion compatibility.” It uses general text semantics as an experimental proxy.
- “This palette scientifically changes your mood.” That is not established here.
- “The model has X% accuracy.” No held-out preference accuracy is measured.
- “We validated the product with users.” Only say this after completing an actual study.

The strongest demonstration is the ability to explain, test and question the implementation, not an inflated technical claim.
