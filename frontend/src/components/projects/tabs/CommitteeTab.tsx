import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  Upload,
  Download,
  Trash2,
  FileText,
  CheckCircle2,
  Circle,
  ArrowRight,
} from 'lucide-react';
import {
  fetchCommitteeStatus,
  transitionCommitteeState,
  uploadBusinessCase,
  downloadBusinessCase,
  deleteBusinessCase,
  STATE_LABELS,
  STATE_COLORS,
  LEVEL_LABELS,
  LEVEL_COLORS,
  type CommitteeStatus,
} from '@/lib/project-committee-api';

interface CommitteeTabProps {
  projectId: number;
  disabled?: boolean;
}

// Workflow states in order
const WORKFLOW_STATES = ['draft', 'presented', 'discussion', 'approved'];

export function CommitteeTab({ projectId, disabled }: CommitteeTabProps) {
  const [status, setStatus] = useState<CommitteeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCommitteeStatus(projectId);
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load committee status');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleTransition = async (newState: string) => {
    if (disabled || transitioning) return;

    setTransitioning(true);
    setError(null);
    try {
      const result = await transitionCommitteeState(projectId, newState);
      setStatus(prev => prev ? {
        ...prev,
        committeeState: result.committeeState,
        allowedTransitions: result.allowedTransitions,
      } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transition state');
    } finally {
      setTransitioning(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || disabled) return;

    setUploading(true);
    setError(null);
    try {
      await uploadBusinessCase(projectId, file);
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = async () => {
    setError(null);
    try {
      await downloadBusinessCase(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download file');
    }
  };

  const handleDelete = async () => {
    if (disabled) return;

    setError(null);
    try {
      await deleteBusinessCase(projectId);
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

  const getCurrentStateIndex = (state: string | null): number => {
    if (!state) return -1;
    if (state === 'rejected') return -2; // Special case for rejected
    return WORKFLOW_STATES.indexOf(state);
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading committee status...</div>;
  }

  if (!status) {
    return <div className="text-muted-foreground">Failed to load committee status</div>;
  }

  const currentStateIndex = getCurrentStateIndex(status.committeeState);
  const isRejected = status.committeeState === 'rejected';

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Committee Level */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Engagement Committee Level</h3>
        <div className="flex items-center gap-2">
          {status.committeeLevel ? (
            <Badge className={LEVEL_COLORS[status.committeeLevel] || 'bg-gray-100 text-gray-800'}>
              {LEVEL_LABELS[status.committeeLevel] || status.committeeLevel}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">
              Set project budget to determine committee level
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {status.committeeLevel === 'mandatory' && 'Projects over threshold require committee approval.'}
          {status.committeeLevel === 'optional' && 'Committee review is optional for this budget level.'}
          {status.committeeLevel === 'not_necessary' && 'Projects under threshold do not require committee review.'}
        </p>
      </div>

      {/* Workflow Progress Visualization */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Workflow Progress</h3>
        <div className="flex items-center gap-2 py-2">
          {WORKFLOW_STATES.map((state, index) => {
            const isCompleted = currentStateIndex >= index && !isRejected;
            const isCurrent = currentStateIndex === index && !isRejected;

            return (
              <div key={state} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                      isCompleted
                        ? 'bg-primary border-primary text-primary-foreground'
                        : isCurrent
                          ? 'border-primary text-primary'
                          : 'border-muted-foreground/30 text-muted-foreground/30'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs mt-1 ${
                      isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground/50'
                    }`}
                  >
                    {STATE_LABELS[state]}
                  </span>
                </div>
                {index < WORKFLOW_STATES.length - 1 && (
                  <ArrowRight
                    className={`h-4 w-4 mx-1 ${
                      currentStateIndex > index && !isRejected
                        ? 'text-primary'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        {isRejected && (
          <div className="flex items-center gap-2 mt-2">
            <Badge className={STATE_COLORS.rejected}>Rejected</Badge>
            <span className="text-sm text-muted-foreground">
              Project was rejected by the committee
            </span>
          </div>
        )}
      </div>

      {/* Current State and Transitions */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Current State</h3>
        <div className="flex items-center gap-3">
          {status.committeeState ? (
            <Badge className={STATE_COLORS[status.committeeState] || 'bg-gray-100 text-gray-800'}>
              {STATE_LABELS[status.committeeState] || status.committeeState}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">Not started</span>
          )}
        </div>

        {/* Transition Buttons */}
        {status.allowedTransitions.length > 0 && !disabled && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Available Actions</h4>
            <div className="flex flex-wrap gap-2">
              {status.allowedTransitions.map((transition) => (
                <Button
                  key={transition}
                  variant={transition === 'rejected' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => handleTransition(transition)}
                  disabled={transitioning}
                >
                  {transitioning ? 'Processing...' : `Move to ${STATE_LABELS[transition] || transition}`}
                </Button>
              ))}
            </div>
          </div>
        )}

        {disabled && status.allowedTransitions.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Project is stopped. Reactivate to change committee state.
          </p>
        )}
      </div>

      {/* Business Case File */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Business Case Document</h3>

        {status.businessCaseFile ? (
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Business Case</p>
              <p className="text-xs text-muted-foreground">
                File uploaded
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              {!disabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-muted/10">
            <FileText className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              No business case document uploaded
            </p>
            {!disabled && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="business-case-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Accepts PDF, Word, or PowerPoint files
                </p>
              </>
            )}
          </div>
        )}

        {/* Replace file button when file exists */}
        {status.businessCaseFile && !disabled && (
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              onChange={handleFileSelect}
              className="hidden"
              id="business-case-replace"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-1" />
              {uploading ? 'Uploading...' : 'Replace Document'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
