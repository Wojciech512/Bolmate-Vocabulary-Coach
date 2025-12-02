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
  Box,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useState } from "react";
import { Flashcard } from "../types";
import { deleteFlashcard } from "../api";

type Props = {
  flashcards: Flashcard[];
  onDeleted: () => void;
};

export default function FlashcardList({ flashcards, onDeleted }: Props) {
  const minPerPage = Number(import.meta.env.VITE_FLASHCARDS_MIN_PER_PAGE) || 5;
  const maxPerPage = Number(import.meta.env.VITE_FLASHCARDS_MAX_PER_PAGE) || 50;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleDelete = async (id: number) => {
    await deleteFlashcard(id);
    onDeleted();
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedFlashcards = flashcards.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
              paginatedFlashcards.map((card) => (
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
                      <Typography variant="caption" color="text.secondary">
                        {card.native_language.toUpperCase()}
                      </Typography>
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
        {flashcards.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Words per page</InputLabel>
              <Select
                value={rowsPerPage}
                label="Words per page"
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(0);
                }}
              >
                {Array.from(
                  { length: Math.floor((maxPerPage - minPerPage) / 5) + 1 },
                  (_, i) => minPerPage + i * 5
                ).map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TablePagination
              component="div"
              count={flashcards.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[]}
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} of ${count}`
              }
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
