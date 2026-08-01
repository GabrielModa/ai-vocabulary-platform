# Vocabulary collection domain

Provider- and framework-neutral rules for learner-owned vocabulary collections created from typed
text, a topic plus requested count, or a photo reference.

All extracted or generated words begin as proposed candidates. The learner may edit them and must
explicitly select at least one candidate before the collection becomes confirmed and eligible for
training. Exact English-term/sense duplicates are rejected while separate senses remain distinct.

This package does not persist collections, invoke AI providers, store photo bytes, expose HTTP
routes, or implement training activities. Those responsibilities belong to later approved tasks.
