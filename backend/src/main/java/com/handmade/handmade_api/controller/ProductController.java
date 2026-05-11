package com.handmade.handmade_api.controller;

import com.handmade.handmade_api.entity.Product;
import com.handmade.handmade_api.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/products")
@CrossOrigin(origins = "http://localhost:3000") // Cho phép React gọi tới
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @GetMapping ()
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }
    @GetMapping("/{id}")
    public  Optional<Product> findById(@PathVariable long id){
        return  productRepository.findById(id);
    }
}
