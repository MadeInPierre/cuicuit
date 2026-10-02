# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Primary: mainstream home cooks (individuals, couples, households) who plan meals loosely and do the weekly groceries. They currently juggle recipe bookmarks, notes and shopping lists, or use a self-hosted recipe manager (Mealie, Norish, Tandoor) and find it clunky. Secondary: self-hosters and open-source enthusiasts, who judge by openness and Docker availability. Cuicuit is a modern alternative to Mealie/Norish for both.

## Product Purpose
Recipe gallery, meal planner and shopping organizer designed to minimize the time spent thinking about meals-to-ingredients management. Success: a visitor signs up (hosted, free) and gets from "recipe link" to "organized shopping list" with almost no effort.

## Positioning
Differentiator is UX, not feature count: throw meal ideas and missing items into a dateless plan at any moment of the week (no calendar, no ceremony); at shopping time the list is already merged and neatly organized (aisle-aware, linked to meals). A live "cookability" badge shows which planned recipes can be cooked as items get checked off.

Honest competitive note (checked 2026-10): Norish is also household-first, real-time, with planning and shared groceries, and already ships a Docker Compose setup. Cuicuit must not claim exclusivity on households, recipe import, or self-hosting readiness. Its defensible claims: dateless "throw it in" planning, cookability badges, effortless organization, modern UX, REST API + MCP built in. Mealie is the "clunky old UX" foil.

## Operating Context
Used on desktop (planning, browsing recipes) and on phone in the supermarket (PWA, no app store). Shared households with synced spaces. Recipes come from food blogs via URL import (schema.org/Recipe plus AI to fill gaps).

## Capabilities and Constraints
Available today (alpha): recipe import from websites with AI auto-fill and guessed filters; dateless meal plan with extra items; derived shopping list with past-purchase suggestions; cookability badges; magic sidebar; shared households and invites; PWA; REST API and MCP; crowd-funded "moneypot"/supporter wall sharing LLM and hosting costs ("seeds" for costly features).
Not available yet, do not market as live: self-hosted Docker release (coming soon), pantry, nutrition, grocery delivery automation, habit learning/recipe suggestions, barcode scanning.
Conversion goal: free sign-up on the hosted version (alpha, unlimited free plan). Secondary: GitHub star / Discord join / waitlist-style interest in self-hosting. Supporter wall is a secondary action.
Undecided: exact one-line positioning wording (to be settled in shape).

## Brand Commitments
Name "Cuicuit": French bird sound "cui-cui" + "cuit" (cooked); "c'est cuicuit" pun. Chick mascot (static/cuicuit_waving.png, logo files in static/). Tone: indie yet professional; solo-maker, community-driven (Discord, GitHub discussions, call-the-maker link). Open source (AGPL-3.0).

## Evidence on Hand
Demo video in README (simple; GitHub asset), hero mockups in static/hero, screenshots in static/screenshots, phone mockups static/hero/mockups. No users, testimonials, ratings or press: none may be fabricated. Real evidence available: open source repo, public roadmap, maker availability, alpha status.

## Product Principles
1. Less planning, more shopping done: every claim ties to time saved on meals-to-ingredients work.
2. Show the product, not promises: real UI and the cookability mechanic are the proof.
3. Honest about alpha: transparent roadmap and status builds indie trust; never claim unreleased features as live.
4. Open and extensible by default: open source, API and MCP are trust signals for the second audience.
5. Mainstream first: no jargon in the main message; self-hosting is a reassurance, not the headline.

## Accessibility & Inclusion
No product-specific requirement established; assume WCAG AA. Content is currently English only (translation planned).
