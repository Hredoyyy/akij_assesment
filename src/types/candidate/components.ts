export type CandidateDashboardHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
};

export type CandidateDashboardPaginationProps = {
  page: number;
  totalPages: number;
  pageSize: number;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export type AttemptResultCardProps = {
  examTitle: string;
  candidateDisplayName: string;
  onBackToDashboard: () => void;
};

export type AttemptTerminationDialogProps = {
  status: "TIMED_OUT" | "VIOLATION_TERMINATED";
  examTitle: string;
  open: boolean;
  onBackToDashboard: () => void;
};
