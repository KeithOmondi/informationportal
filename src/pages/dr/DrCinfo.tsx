import CourtInformation from "../judge/CourtInformation";

/**
 * DrCinfo
 *
 * The DR-facing programme page. ConferencePortal reads the authenticated
 * user's role from state.auth.user.role ("dr") and passes it to
 * fetchProgram("dr"), so the backend returns only the program scoped to
 * targetAudience "dr" or "all". No additional props or logic needed here.
 */
const DrCinfo = () => {
  return <CourtInformation />;
};

export default DrCinfo;