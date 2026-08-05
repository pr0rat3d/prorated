-- M1: Score range constraints (sub-scores allow 0 = not rated)
ALTER TABLE reviews
  ADD CONSTRAINT chk_overall_score       CHECK (overall_score       BETWEEN 1 AND 5),
  ADD CONSTRAINT chk_payment_score       CHECK (payment_score       BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_access_score        CHECK (access_score        BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_communication_score CHECK (communication_score BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_timeline_score      CHECK (timeline_score      BETWEEN 0 AND 5),
  ADD CONSTRAINT chk_obstacles_score     CHECK (obstacles_score     BETWEEN 0 AND 5);