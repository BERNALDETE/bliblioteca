package br.unitins.biblioteca.livro;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LivroRepository extends CrudRepository<Livro, Long> {

}
public interface Repository {LivroRepository extends CrudRepository<Livro, Long>
}
