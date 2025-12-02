import { Box, LinearProgress, Typography } from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

const shimmer = keyframes`
  0% {
    background-position: -100% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const ShimmerBox = styled(Box)(({ theme }) => ({
  position: "relative",
  height: 32,
  borderRadius: theme.shape.borderRadius * 2,
  overflow: "hidden",
  backgroundColor: theme.palette.grey[200],
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(
      90deg,
      transparent 0%,
      ${theme.palette.common.white}40 50%,
      transparent 100%
    )`,
    backgroundSize: "200% 100%",
    animation: `${shimmer} 2s infinite`,
    pointerEvents: "none",
  },
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: "100%",
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: theme.palette.grey[200],
  "& .MuiLinearProgress-bar": {
    borderRadius: theme.shape.borderRadius * 2,
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
  },
}));

const MilestoneMarker = styled(Box)<{ markerPosition: number }>(
  ({ theme, markerPosition }) => ({
    position: "absolute",
    left: `${markerPosition}%`,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: theme.palette.divider,
    zIndex: 1,
    "&::after": {
      content: '""',
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: 8,
      height: 8,
      borderRadius: "50%",
      backgroundColor: theme.palette.background.paper,
      border: `2px solid ${theme.palette.divider}`,
    },
  }),
);

interface StreakProgressBarProps {
  streak: number;
  maxStreak?: number;
}

export default function StreakProgressBar({
  streak,
  maxStreak = 10,
}: StreakProgressBarProps) {
  const progress = Math.min((streak / maxStreak) * 100, 100);
  const milestones = [3, 5, 10];

  return (
    <Box sx={{ width: "100%", mb: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Streak: {streak} / {maxStreak}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {streak >= 10
            ? "Max!"
            : `Next milestone: ${milestones.find((m) => m > streak) || maxStreak}`}
        </Typography>
      </Box>
      <ShimmerBox>
        <Box sx={{ position: "relative", height: "100%" }}>
          {milestones.map((milestone) => (
            <MilestoneMarker
              key={milestone}
              markerPosition={(milestone / maxStreak) * 100}
            />
          ))}
          <StyledLinearProgress variant="determinate" value={progress} />
        </Box>
      </ShimmerBox>
    </Box>
  );
}
