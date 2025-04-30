package br.unitins.biblioteca.livro;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class LivroService {@Autowired
LivroRepository livroRepository;

    List<Livro> getLivros(){
        return (List<Livro>) livroRepository.findAll();
    }

    Livro criarLivro(Livro livro){
        return livroRepository.save(livro);
    }
}
