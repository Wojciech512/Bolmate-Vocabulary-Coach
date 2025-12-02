import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
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

  if (!flashcards.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No flashcards yet. Add your first word above.
      </Typography>
    );
  }

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
              <TableCell>Translation</TableCell>
              <TableCell>Stats</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flashcards.map((card) => (
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
                    <Typography variant="body2">✅ {card.correct_count}</Typography>
                    <Typography variant="body2">❌ {card.incorrect_count}</Typography>
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
