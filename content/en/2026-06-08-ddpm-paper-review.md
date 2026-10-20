---
thumbnail: /assets/img/posts/ddpm-paper-review.webp
thumbnail_alt: First slide of the original presentation
title: "[Review] Denoising Diffusion Probabilistic Models (DDPM)"
date: 2026-06-08
categories:
  - Paper Notes
tags:
  - Diffusion
  - Generative Model
  - DDPM
  - Score Matching
  - Image Generation
description: Ho et al. (2020) — the paper that put diffusion models on the map
  for high-quality image generation.
source_sha256: db685ba5a8fa0e6e327f4d6b53ef5e3a2146f002c65fbef7db58a9ecb63774e6
---

<div class="presentation">
  <iframe src="https://docs.google.com/presentation/d/e/2PACX-1vTGWN01nz7ygVGRE_jQlLK_aExHC3-C9lHD6wXpQ0xRRuntKVbJ0e5llkaic1I3x9UhzltSnSuIf-uv/embed?hl=en&amp;start=false&amp;loop=false&amp;delayms=3000" title="Original presentation" allowfullscreen></iframe>
  <div class="presentation-caption"><span>ORIGINAL PRESENTATION</span><a href="https://docs.google.com/presentation/d/e/2PACX-1vTGWN01nz7ygVGRE_jQlLK_aExHC3-C9lHD6wXpQ0xRRuntKVbJ0e5llkaic1I3x9UhzltSnSuIf-uv/pub?start=false&amp;loop=false&amp;delayms=3000" target="_blank" rel="noopener noreferrer">Open presentation ↗</a></div>
</div>

---

## Summary

### TL;DR
DDPM (Ho et al., NeurIPS 2020) showed that **diffusion probabilistic models** can generate high-quality images competitive with GANs by learning to reverse a gradual noising process — without adversarial training.

### Background
Diffusion models had been proposed theoretically (Sohl-Dickstein et al., 2015), but had not yet demonstrated strong image synthesis quality. DDPM was the paper that closed this gap.

### The Core Idea

**Forward Process (Diffusion)**
Starting from a clean image $x_0$, Gaussian noise is added step-by-step over $T$ timesteps:

$$q(x_t \mid x_{t-1}) = \mathcal{N}(x_t;\ \sqrt{1-\beta_t}\, x_{t-1},\ \beta_t \mathbf{I})$$

After enough steps, $x_T$ is approximately pure Gaussian noise — structure is completely destroyed.

**Reverse Process (Denoising)**
A neural network $\epsilon_\theta$ (U-Net) is trained to predict the noise added at each step, so the reverse trajectory can be run:

$$p_\theta(x_{t-1} \mid x_t) = \mathcal{N}(x_{t-1};\ \mu_\theta(x_t, t),\ \Sigma_\theta)$$

**Training Objective**
Instead of optimizing the full variational lower bound, the authors found a simpler surrogate works better — just predict the added noise:

$$\mathcal{L}_{\text{simple}} = \mathbb{E}_{t, x_0, \epsilon}\left[\|\epsilon - \epsilon_\theta(\sqrt{\bar\alpha_t}\, x_0 + \sqrt{1-\bar\alpha_t}\, \epsilon,\; t)\|^2\right]$$

This is essentially **denoising score matching** at multiple noise levels.

### Key Results
- Achieved FID of **3.17** on CIFAR-10 (surpassing many GAN variants at the time)
- High-quality 256×256 image synthesis on LSUN and CelebA-HQ
- Showed that the objective is equivalent to a **weighted sum of denoising score matching** losses

### Connections
- Equivalent to learning the **score function** $\nabla_{x_t} \log p(x_t)$ at each noise level
- Directly connects to **score-based generative models** (Song & Ermon, 2019)
- Foundation for **DDIM**, **Stable Diffusion**, **DALL·E 2**, **Imagen**, and essentially all modern text-to-image systems

---

## Additional Perspective

The forward noising process is fixed rather than learned. The U-Net learns the reverse process by predicting the noise added at each step. Compared with adversarial training, this provides a stable probabilistic formulation, with sampling speed as a major tradeoff.

| Aspect | GANs | DDPM |
|---|---|---|
| Training | Can be unstable | Stable denoising objective |
| Diversity | Can suffer from mode collapse | Broad sample diversity |
| Formulation | Adversarial objective | Probabilistic model |
| Sampling speed | Fast generation | Multiple denoising steps |

Later work built on this foundation: DDIM improved sampling speed, Stable Diffusion moved generation into latent space, and text-conditioned systems such as DALL·E 2 and Imagen extended the conditioning.

## Takeaway

> Repeatedly adding noise destroys an image's structure. Learning to reverse that process makes it possible to generate an image from noise.

See the original presentation linked above for quantitative results and algorithm details.
