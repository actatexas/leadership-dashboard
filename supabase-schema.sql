-- ============================================
-- CAPSTONE LEADERSHIP DASHBOARD - DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================

-- Clients table
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  mrr_amount DECIMAL(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'churned')),
  start_date DATE,
  churn_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- MRR Events table
CREATE TABLE mrr_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('new', 'expansion', 'contraction', 'churn')),
  mrr_change DECIMAL(12,2) NOT NULL,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE mrr_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view clients"
  ON clients FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert clients"
  ON clients FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON clients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clients"
  ON clients FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view mrr_events"
  ON mrr_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert mrr_events"
  ON mrr_events FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update mrr_events"
  ON mrr_events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete mrr_events"
  ON mrr_events FOR DELETE TO authenticated USING (true);

-- Indexes
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_mrr_events_date ON mrr_events(event_date);
CREATE INDEX idx_mrr_events_client ON mrr_events(client_id);
