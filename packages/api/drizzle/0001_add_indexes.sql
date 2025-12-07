-- Add performance indexes for PHM database

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_account_id ON users(account_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_account_id ON customers(account_id);
CREATE INDEX IF NOT EXISTS idx_customers_postcode ON customers(postcode);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);

-- Leads indexes
CREATE INDEX IF NOT EXISTS idx_leads_account_id ON leads(account_id);
CREATE INDEX IF NOT EXISTS idx_leads_customer_id ON leads(customer_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_account_id ON products(account_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_manufacturer ON products(manufacturer);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Quotes indexes
CREATE INDEX IF NOT EXISTS idx_quotes_account_id ON quotes(account_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_lead_id ON quotes(lead_id);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);

-- Quote lines indexes
CREATE INDEX IF NOT EXISTS idx_quote_lines_quote_id ON quote_lines(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_lines_product_id ON quote_lines(product_id);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_account_id ON appointments(account_id);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_assigned_to ON appointments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_start ON appointments(scheduled_start);

-- Visit sessions indexes
CREATE INDEX IF NOT EXISTS idx_visit_sessions_account_id ON visit_sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_visit_sessions_customer_id ON visit_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_visit_sessions_appointment_id ON visit_sessions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_visit_sessions_surveyor_id ON visit_sessions(surveyor_id);
CREATE INDEX IF NOT EXISTS idx_visit_sessions_status ON visit_sessions(status);
CREATE INDEX IF NOT EXISTS idx_visit_sessions_started_at ON visit_sessions(started_at DESC);

-- Survey modules indexes
CREATE INDEX IF NOT EXISTS idx_survey_modules_visit_session_id ON survey_modules(visit_session_id);
CREATE INDEX IF NOT EXISTS idx_survey_modules_module_type ON survey_modules(module_type);
CREATE INDEX IF NOT EXISTS idx_survey_modules_status ON survey_modules(status);

-- Transcriptions indexes
CREATE INDEX IF NOT EXISTS idx_transcriptions_visit_session_id ON transcriptions(visit_session_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_module_id ON transcriptions(module_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_recorded_at ON transcriptions(recorded_at DESC);

-- Visit observations indexes
CREATE INDEX IF NOT EXISTS idx_visit_observations_visit_session_id ON visit_observations(visit_session_id);
CREATE INDEX IF NOT EXISTS idx_visit_observations_transcription_id ON visit_observations(transcription_id);
CREATE INDEX IF NOT EXISTS idx_visit_observations_category ON visit_observations(category);
CREATE INDEX IF NOT EXISTS idx_visit_observations_observation_type ON visit_observations(observation_type);

-- Media attachments indexes
CREATE INDEX IF NOT EXISTS idx_media_attachments_visit_session_id ON media_attachments(visit_session_id);
CREATE INDEX IF NOT EXISTS idx_media_attachments_module_id ON media_attachments(module_id);
CREATE INDEX IF NOT EXISTS idx_media_attachments_file_type ON media_attachments(file_type);
CREATE INDEX IF NOT EXISTS idx_media_attachments_uploaded_at ON media_attachments(uploaded_at DESC);

-- Boiler specifications indexes
CREATE INDEX IF NOT EXISTS idx_boiler_specifications_manufacturer ON boiler_specifications(manufacturer);
CREATE INDEX IF NOT EXISTS idx_boiler_specifications_model ON boiler_specifications(model);
CREATE INDEX IF NOT EXISTS idx_boiler_specifications_fuel_type ON boiler_specifications(fuel_type);
CREATE INDEX IF NOT EXISTS idx_boiler_specifications_boiler_type ON boiler_specifications(boiler_type);
CREATE INDEX IF NOT EXISTS idx_boiler_specifications_is_active ON boiler_specifications(is_active);
CREATE INDEX IF NOT EXISTS idx_boiler_specifications_output_kw ON boiler_specifications(output_kw);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_account_id ON audit_log(account_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type ON audit_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- Password reset tokens indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Email templates indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_account_id ON email_templates(account_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_template_key ON email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON email_templates(is_active);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_account_status ON leads(account_id, status);
CREATE INDEX IF NOT EXISTS idx_quotes_account_status ON quotes(account_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_account_status_date ON appointments(account_id, status, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_visit_sessions_account_status ON visit_sessions(account_id, status);
