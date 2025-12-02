from __future__ import annotations



def test_healthcheck(app_client):
    response = app_client.get("/api/health")
    assert response.status_code == 200
    assert response.get_json() == {"status": "ok"}


def test_create_and_list_users(app_client):
    create_resp = app_client.post(
        "/users",
        json={"name": "Alice", "email": "alice@example.com"},
    )
    assert create_resp.status_code == 201
    data = create_resp.get_json()
    assert data["name"] == "Alice"
    assert data["email"] == "alice@example.com"

    list_resp = app_client.get("/users")
    users = list_resp.get_json()
    assert any(user["email"] == "alice@example.com" for user in users)


def test_flashcard_creation_and_filters(app_client):
    first = {
        "source_word": "hola",
        "translated_word": "cześć",
        "native_language": "pl",
        "source_language": "es",
        "difficulty_level": "A1",
    }
    second = {
        "source_word": "gracias",
        "translated_word": "dziękuję",
        "native_language": "pl",
        "source_language": "es",
    }
    assert app_client.post("/api/flashcards", json=first).status_code == 201
    assert app_client.post("/api/flashcards", json=second).status_code == 201

    filtered = app_client.get("/api/flashcards", query_string={"difficulty_level": "A1"})
    cards = filtered.get_json()
    assert len(cards) == 1
    assert cards[0]["source_word"] == "hola"


def test_flashcard_duplicate_guard(app_client):
    payload = {
        "source_word": "hola",
        "translated_word": "cześć",
        "native_language": "pl",
        "source_language": "es",
    }
    first = app_client.post("/api/flashcards", json=payload)
    assert first.status_code == 201

    duplicate = app_client.post("/api/flashcards", json=payload)
    assert duplicate.status_code == 409
    assert duplicate.get_json()["error"] == "Flashcard already exists for this language pair."


def test_language_switch_empty_and_duplicate_guard(monkeypatch, app_client):
    # When there are no flashcards
    empty_resp = app_client.post("/api/languages/switch", json={"target_language": "en"})
    empty_data = empty_resp.get_json()
    assert empty_resp.status_code == 200
    assert empty_data["flashcards"] == []
    assert empty_data["meta"]["translated_count"] == 0

    # Seed flashcards to trigger duplicate detection
    first_card = {
        "source_word": "hola",
        "translated_word": "cześć",
        "native_language": "pl",
        "source_language": "es",
    }
    second_card = {
        "source_word": "hola",
        "translated_word": "hello",
        "native_language": "en",
        "source_language": "es",
    }
    first_resp = app_client.post("/api/flashcards", json=first_card)
    second_resp = app_client.post("/api/flashcards", json=second_card)
    assert first_resp.status_code == 201
    assert second_resp.status_code == 201

    def fake_translate(cards, target_language):
        return [
            {**card, "native_language": target_language} for card in cards
        ]

    monkeypatch.setattr("app.routes.languages.translate_flashcards", fake_translate)

    conflict = app_client.post(
        "/api/languages/switch",
        json={"target_language": "pl", "flashcard_ids": [second_resp.get_json()["id"]]},
    )
    assert conflict.status_code == 409
    assert "duplicate" in conflict.get_json()["error"].lower()


def test_interpret_json_and_plain_text(monkeypatch, app_client):
    interpreted = [{"source_word": "hola", "translated_word": "cześć", "native_language": "pl"}]

    def fake_interpret(text, native_language):
        return [{**item, "source_language": "es", "native_language": native_language} for item in interpreted]

    monkeypatch.setattr("app.routes.interpret.interpret_text_with_ai", fake_interpret)

    json_resp = app_client.post(
        "/api/interpret",
        json={"text": "hola mundo", "native_language": "pl"},
    )
    assert json_resp.status_code == 200
    assert json_resp.get_json()["items"][0]["native_language"] == "pl"

    text_resp = app_client.post(
        "/api/interpret",
        data="gracias",
        content_type="text/plain",
    )
    assert text_resp.status_code == 200
    assert text_resp.get_json()["items"][0]["source_language"] == "es"


