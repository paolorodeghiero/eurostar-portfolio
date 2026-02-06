-- Create GIN index on audit_log.changes for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_audit_changes ON audit_log USING GIN (changes);

-- Create composite index for efficient project history lookups
CREATE INDEX IF NOT EXISTS idx_audit_lookup ON audit_log (table_name, record_id);

-- Audit log function for projects table
CREATE OR REPLACE FUNCTION audit_project_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields jsonb := '{}'::jsonb;
  user_email text;
BEGIN
  -- Get user email from application context (set via SET LOCAL)
  user_email := current_setting('app.current_user_email', true);
  IF user_email IS NULL OR user_email = '' THEN
    user_email := 'system';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Compare old and new values for each field, add to changes if different
    IF OLD.name IS DISTINCT FROM NEW.name THEN
      changed_fields := changed_fields || jsonb_build_object('name',
        jsonb_build_object('old', OLD.name, 'new', NEW.name));
    END IF;
    IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
      changed_fields := changed_fields || jsonb_build_object('statusId',
        jsonb_build_object('old', OLD.status_id, 'new', NEW.status_id));
    END IF;
    IF OLD.start_date IS DISTINCT FROM NEW.start_date THEN
      changed_fields := changed_fields || jsonb_build_object('startDate',
        jsonb_build_object('old', OLD.start_date, 'new', NEW.start_date));
    END IF;
    IF OLD.end_date IS DISTINCT FROM NEW.end_date THEN
      changed_fields := changed_fields || jsonb_build_object('endDate',
        jsonb_build_object('old', OLD.end_date, 'new', NEW.end_date));
    END IF;
    IF OLD.lead_team_id IS DISTINCT FROM NEW.lead_team_id THEN
      changed_fields := changed_fields || jsonb_build_object('leadTeamId',
        jsonb_build_object('old', OLD.lead_team_id, 'new', NEW.lead_team_id));
    END IF;
    IF OLD.project_manager IS DISTINCT FROM NEW.project_manager THEN
      changed_fields := changed_fields || jsonb_build_object('projectManager',
        jsonb_build_object('old', OLD.project_manager, 'new', NEW.project_manager));
    END IF;
    IF OLD.is_owner IS DISTINCT FROM NEW.is_owner THEN
      changed_fields := changed_fields || jsonb_build_object('isOwner',
        jsonb_build_object('old', OLD.is_owner, 'new', NEW.is_owner));
    END IF;
    IF OLD.sponsor IS DISTINCT FROM NEW.sponsor THEN
      changed_fields := changed_fields || jsonb_build_object('sponsor',
        jsonb_build_object('old', OLD.sponsor, 'new', NEW.sponsor));
    END IF;
    IF OLD.is_stopped IS DISTINCT FROM NEW.is_stopped THEN
      changed_fields := changed_fields || jsonb_build_object('isStopped',
        jsonb_build_object('old', OLD.is_stopped, 'new', NEW.is_stopped));
    END IF;
    IF OLD.opex_budget IS DISTINCT FROM NEW.opex_budget THEN
      changed_fields := changed_fields || jsonb_build_object('opexBudget',
        jsonb_build_object('old', OLD.opex_budget, 'new', NEW.opex_budget));
    END IF;
    IF OLD.capex_budget IS DISTINCT FROM NEW.capex_budget THEN
      changed_fields := changed_fields || jsonb_build_object('capexBudget',
        jsonb_build_object('old', OLD.capex_budget, 'new', NEW.capex_budget));
    END IF;
    IF OLD.budget_currency IS DISTINCT FROM NEW.budget_currency THEN
      changed_fields := changed_fields || jsonb_build_object('budgetCurrency',
        jsonb_build_object('old', OLD.budget_currency, 'new', NEW.budget_currency));
    END IF;
    IF OLD.committee_state IS DISTINCT FROM NEW.committee_state THEN
      changed_fields := changed_fields || jsonb_build_object('committeeState',
        jsonb_build_object('old', OLD.committee_state, 'new', NEW.committee_state));
    END IF;
    IF OLD.committee_level IS DISTINCT FROM NEW.committee_level THEN
      changed_fields := changed_fields || jsonb_build_object('committeeLevel',
        jsonb_build_object('old', OLD.committee_level, 'new', NEW.committee_level));
    END IF;
    IF OLD.business_case_file IS DISTINCT FROM NEW.business_case_file THEN
      changed_fields := changed_fields || jsonb_build_object('businessCaseFile',
        jsonb_build_object('old', OLD.business_case_file, 'new', NEW.business_case_file));
    END IF;

    -- Only log if there were actual changes (ignoring version, timestamps)
    IF changed_fields != '{}'::jsonb THEN
      INSERT INTO audit_log (table_name, record_id, changed_by, operation, changes)
      VALUES ('projects', NEW.id, user_email, 'UPDATE', changed_fields);
    END IF;

    RETURN NEW;

  ELSIF TG_OP = 'INSERT' THEN
    -- For INSERT, log key fields as "new" values
    changed_fields := jsonb_build_object(
      'projectId', jsonb_build_object('new', NEW.project_id),
      'name', jsonb_build_object('new', NEW.name),
      'leadTeamId', jsonb_build_object('new', NEW.lead_team_id)
    );
    INSERT INTO audit_log (table_name, record_id, changed_by, operation, changes)
    VALUES ('projects', NEW.id, user_email, 'INSERT', changed_fields);

    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, record_id, changed_by, operation, changes)
    VALUES ('projects', OLD.id, user_email, 'DELETE',
      jsonb_build_object('projectId', jsonb_build_object('old', OLD.project_id)));

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to projects table
DROP TRIGGER IF EXISTS audit_projects_trigger ON projects;
CREATE TRIGGER audit_projects_trigger
AFTER INSERT OR UPDATE OR DELETE ON projects
FOR EACH ROW EXECUTE FUNCTION audit_project_changes();
