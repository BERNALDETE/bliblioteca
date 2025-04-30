package br.unitins.biblioteca.livro;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data

public class Livro {@Id
@GeneratedValue(strategy = GenerationType.AUTO)
Long idLivro;
    String titulo;
    String autor;
    String editora;
    int qtdePaginas;
}
