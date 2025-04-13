from flask import Flask, request, jsonify, render_template
import os
import json
import re

app = Flask(__name__)

PONTOS_FILE = "pontos.txt"
POSTS_FILE = "posts.txt"
MENSAGENS_FILE = "mensagens.txt"

# ---------- Funções Auxiliares ----------
def formatar_nome(nome):
    return " ".join(word.capitalize() for word in nome.strip().split())

def caminho_usuario_atual(guia_id):
    return f"usuario_atual_{guia_id}.txt"

def obter_usuario_atual(guia_id):
    path = caminho_usuario_atual(guia_id)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return f.read().strip()
    return "Anônimo"

def salvar_usuario_atual(guia_id, nome):
    path = caminho_usuario_atual(guia_id)
    with open(path, "w", encoding="utf-8") as f:
        f.write(nome)

# ---------- Pontuação ----------
def carregar_pontos():
    if not os.path.exists(PONTOS_FILE):
        return {}
    pontuacoes = {}
    with open(PONTOS_FILE, "r", encoding="utf-8") as f:
        for linha in f:
            if ":" in linha:
                nome, pontos = linha.strip().split(":", 1)
                pontuacoes[nome.strip()] = int(pontos.strip())
    return pontuacoes

def salvar_pontos(pontuacoes):
    with open(PONTOS_FILE, "w", encoding="utf-8") as f:
        for nome, pontos in pontuacoes.items():
            f.write(f"{nome}: {pontos}\n")

# ---------- Posts ----------
def salvar_post(post):
    with open(POSTS_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(post, ensure_ascii=False) + "\n")

def carregar_posts():
    if not os.path.exists(POSTS_FILE):
        return []
    posts = []
    with open(POSTS_FILE, "r", encoding="utf-8") as f:
        for linha in f:
            try:
                posts.append(json.loads(linha))
            except:
                continue
    return posts

# ---------- Mensagens ----------
def salvar_mensagem(mensagem):
    with open(MENSAGENS_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(mensagem, ensure_ascii=False) + "\n")

def carregar_mensagens():
    if not os.path.exists(MENSAGENS_FILE):
        return []
    mensagens = []
    with open(MENSAGENS_FILE, "r", encoding="utf-8") as f:
        for linha in f:
            try:
                mensagens.append(json.loads(linha))
            except:
                continue
    return mensagens

# ---------- Rotas ----------
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/mensagens")
def mensagens():
    return render_template("mensagens.html")

@app.route("/add_post", methods=["POST"])
def add_post():
    post = request.get_json()
    salvar_post(post)

    nome = post.get("autor", "").strip()
    guia_id = post.get("guia_id", "default")
    if nome:
        salvar_usuario_atual(guia_id, nome)

    return jsonify({"status": "ok"})

@app.route("/posts", methods=["GET"])
def get_posts():
    return jsonify(list(reversed(carregar_posts())))

@app.route("/adicionar_ponto", methods=["POST"])
def adicionar_ponto():
    data = request.get_json()
    nome = data.get("nome", "").strip()
    if not nome or re.search(r"[^a-zA-Zà-úÀ-Ú ]", nome):
        return jsonify({"erro": "Nome inválido"}), 400

    nome_formatado = formatar_nome(nome)
    pontuacoes = carregar_pontos()
    pontuacoes[nome_formatado] = pontuacoes.get(nome_formatado, 0) + 10
    salvar_pontos(pontuacoes)

    return jsonify({"status": "ok"})

@app.route("/get_pontos", methods=["POST"])
def get_pontos():
    nome = request.json["nome"].strip()
    nome_formatado = formatar_nome(nome)
    pontuacoes = carregar_pontos()
    pontos = pontuacoes.get(nome_formatado, 0)
    return jsonify(pontos)

@app.route("/enviar_mensagem", methods=["POST"])
def enviar_mensagem():
    data = request.get_json()
    texto = data.get("texto", "").strip()
    autor = data.get("autor", "").strip()
    guia_id = data.get("guia_id", "default")

    if not texto:
        return jsonify({"erro": "Mensagem vazia"}), 400

    if not autor:
        autor = "Anônimo"

    salvar_usuario_atual(guia_id, autor)
    mensagem = {"autor": autor, "texto": texto}
    salvar_mensagem(mensagem)
    return jsonify({"status": "ok"})

@app.route("/mensagens_salvas", methods=["GET"])
def mensagens_salvas():
    return jsonify(carregar_mensagens())

@app.route("/atualizar_usuario", methods=["POST"])
def atualizar_usuario():
    data = request.get_json()
    nome = data.get("nome", "").strip()
    guia_id = data.get("guia_id", "default")

    if not nome:
        return "Nome inválido", 400

    salvar_usuario_atual(guia_id, nome)
    return "Nome atualizado com sucesso", 200

if __name__ == "__main__":
    app.run(debug=True)
