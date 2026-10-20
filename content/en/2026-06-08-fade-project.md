---
thumbnail: /assets/img/posts/fade-project.webp
thumbnail_alt: First slide of the original presentation
title: "FADE: Foreground Attention Decoupling for Object Generation in
  Training-Free Image Editing"
date: 2026-06-08
categories:
  - Projects
tags:
  - Image Editing
  - Diffusion
  - Attention
  - Training-Free
  - FADE
description: FADE separates foreground and background attention to insert
  objects naturally in training-free diffusion image editing.
source_sha256: 292abc8187676b16d031bebe79d691f0bc620ebf7f2cb7d81186b5c0fa478d87
---

<div class="presentation">
  <iframe src="https://docs.google.com/presentation/d/e/2PACX-1vQiraWxGMfMfn9k3YpEKbZSYLhBGf98fpC6i-fJtVr4_2ti9DzlDvbOg399RM5UBA/embed?hl=en&amp;start=false&amp;loop=false&amp;delayms=3000" title="Original presentation" allowfullscreen></iframe>
  <div class="presentation-caption"><span>ORIGINAL PRESENTATION</span><a href="https://docs.google.com/presentation/d/e/2PACX-1vQiraWxGMfMfn9k3YpEKbZSYLhBGf98fpC6i-fJtVr4_2ti9DzlDvbOg399RM5UBA/pub?start=false&amp;loop=false&amp;delayms=3000" target="_blank" rel="noopener noreferrer">Open presentation ↗</a></div>
</div>

## Overview

**FADE** is a training-free image editing method that separates a diffusion model's **foreground and background attention maps**, allowing a new object to be inserted naturally into an image without additional training.

## The Problem

Existing training-free editing methods manipulate cross-attention and self-attention to insert objects. However, foreground attention can spill into the background, while background attention can interfere with the object.

- Inserting a new object may distort the surrounding scene.
- The object's shape or texture may become blurred or blend into the background.

This happens when attention is computed globally without explicitly separating foreground from background.

## The Core Idea: Foreground Attention Decoupling

FADE **decouples foreground attention from background attention**:

1. **Extract a foreground mask.** Identify the target object region using attention maps or segmentation.
2. **Decouple attention.** Restrict foreground self-attention to the object region and background self-attention to the surrounding scene.
3. **Edit without training.** Apply the attention manipulation during inference, without LoRA or fine-tuning.

## Why It Helps

- Less interference between foreground and background attention improves background preservation.
- The inserted object retains its shape and texture more clearly.
- The method can be applied to existing diffusion models, such as SDXL, without additional training costs.

## Takeaway

> Separating foreground and background attention helps preserve both the inserted object and the scene around it.

See the original presentation linked above for equations and quantitative results.
