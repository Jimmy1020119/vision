---
thumbnail: /assets/img/posts/vps-paper-review.webp
thumbnail_alt: First slide of the original presentation
title: "[Review] Video Parallel Scaling (VPS): How to Give VideoLLMs More Eyes
  Without Blowing Up Your Memory"
date: 2026-06-07
categories:
  - Paper Notes
tags:
  - VideoLLM
  - VPS
  - Inference
  - Scaling
  - Paper
  - Review
description: Video Parallel Scaling (VPS) — giving VideoLLMs more eyes without
  blowing up memory.
source_sha256: 4ed7dade5696807e933f5cfdf0c1d1c0f6db4b5586c6f1ef77b8fc670af3cae8
---

<div class="presentation">
  <iframe src="https://docs.google.com/presentation/d/e/2PACX-1vQXchIJaM1i8bFee7Un87Z5uTrBYJhYtwtH-GCm4XDmjm3rkTLKb8au4YVVoeD8HnXzr7ZuAG1noi-l/embed?hl=en&amp;start=false&amp;loop=false&amp;delayms=3000" title="Original presentation" allowfullscreen></iframe>
  <div class="presentation-caption"><span>ORIGINAL PRESENTATION</span><a href="https://docs.google.com/presentation/d/e/2PACX-1vQXchIJaM1i8bFee7Un87Z5uTrBYJhYtwtH-GCm4XDmjm3rkTLKb8au4YVVoeD8HnXzr7ZuAG1noi-l/pub?start=false&amp;loop=false&amp;delayms=3000" target="_blank" rel="noopener noreferrer">Open presentation ↗</a></div>
</div>

## Overview

**Video Parallel Scaling (VPS)** is an inference technique that splits video input into parallel streams, allowing a VideoLLM to process more frames without an unmanageable increase in memory and computation.

## The Problem

- More input frames can improve a VideoLLM's performance, but they also increase token counts, KV-cache memory, and computation.
- Sampling fewer frames can miss important moments in a long video.
- The central challenge is balancing broader temporal coverage with limited memory.

## The Core Idea

- Split a video into **parallel streams**, each responsible for a subset of frames.
- Process the streams in parallel and **aggregate their results**, covering a broader time span without placing every frame in a single context.
- This increases effective frame coverage without extending one context proportionally.

## Why It Helps

- Parallel splitting and aggregation moderate the memory and computation costs associated with longer contexts.
- The approach operates at **inference time**, without additional training.

## Takeaway

> When more frames are needed but memory is limited, process the video across parallel streams instead of building one longer context.

This is a simplified explanation. See the original presentation linked above for equations and benchmark results.
