import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Card,
  CardContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Stack,
  Tooltip,
  Alert,
} from "@mui/material";
import { Flashcard } from "../types";
import { deleteFlashcard } from "../api";

type Props = {
  flashcards: Flashcard[];
  onDeleted: () => void;
};

export default function FlashcardList({ flashcards, onDeleted }: Props) {
  const handleDelete = async (id: number) => {
    await deleteFlashcard(id);
    onDeleted();
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Saved words
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Source</TableCell>
              <TableCell>Target translation</TableCell>
              <TableCell>Stats</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!flashcards.length ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Alert severity="warning" icon={<WarningAmberIcon />}>
                    No flashcards yet. Add your first word above.
                  </Alert>
                </TableCell>
              </TableRow>
            ) : (
              flashcards.map((card) => (
                <TableRow key={card.id} hover>
                  <TableCell width="20%">
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2">{card.source_word}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {card.source_language.toUpperCase()}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell width="40%">
                    <Stack spacing={0.5}>
                      <Typography>{card.translated_word}</Typography>
                      {card.example_sentence && (
                        <Typography variant="body2" color="text.secondary">
                          {card.example_sentence}
                          {card.example_sentence_translated &&
                            ` — ${card.example_sentence_translated}`}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell width="25%">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Tooltip title="Correct answers">
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <CheckCircleOutlineIcon fontSize="small" color="success" />
                          <Typography variant="body2">{card.correct_count}</Typography>
                        </Stack>
                      </Tooltip>
                      <Tooltip title="Incorrect answers">
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <CancelOutlinedIcon fontSize="small" color="error" />
                          <Typography variant="body2">
                            {card.incorrect_count}
                          </Typography>
                        </Stack>
                      </Tooltip>
                      {card.difficulty_level && (
                        <Chip
                          label={card.difficulty_level}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="right" width="15%">
                    <Tooltip title="Delete flashcard">
                      <IconButton color="error" onClick={() => handleDelete(card.id)}>
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
